import { expect, test } from "@playwright/test";

// A phone's memory along the whole Home (iOS kills a tab past its budget: the photo drawn in blocks, then "Um
// problema ocorreu repetidamente"). In WebKit at 390×844, 3×: at every half screen of the scroll,
// - the decoded pixels alive (every loaded <img> still in the page) stay ≤ 25 MP;
// - no layer of its own (a 3D transform or a will-change on transform/opacity) holds more than 4096² device px (a
//   long thin strip, the road's dashes, is fine: it is the area that costs);
// - at most one WebGL context is alive.

const MAX_PIXELS = 25e6;
const MAX_LAYER = 4096 * 4096;

test("the Home stays within a phone's memory, all the way down", async ({ page, browserName, isMobile }) => {
  test.skip(browserName !== "webkit" || !isMobile, "the phone: WebKit at 390×844, 3×");
  test.setTimeout(240_000);
  await page.addInitScript(() => {
    // every WebGL context made, until lost (or its canvas gone from the page)
    const live = new Set<HTMLCanvasElement>();
    (window as unknown as { __gl: Set<HTMLCanvasElement> }).__gl = live;
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      const ctx = (get as (...a: unknown[]) => RenderingContext | null).call(this, type, ...rest);
      if (ctx && /webgl/.test(type) && !live.has(this)) {
        live.add(this);
        this.addEventListener("webglcontextlost", () => live.delete(this));
      }
      return ctx;
    } as typeof get;
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3000);

  const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const step = await page.evaluate(() => innerHeight / 2);
  let worst = { pixels: 0, layer: "", area: 0, gl: 0 };
  for (let y = 0; y <= end + step; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), Math.min(y, end));
    await page.waitForTimeout(150);
    const m = await page.evaluate(() => {
      const dpr = devicePixelRatio;
      let pixels = 0;
      for (const img of document.images) if (img.complete && img.naturalWidth) pixels += img.naturalWidth * img.naturalHeight;
      let area = 0;
      let layer = "";
      for (const el of document.querySelectorAll<HTMLElement>("body *")) {
        if (!/3d/.test(el.style.transform) && !/transform|opacity/.test(getComputedStyle(el).willChange)) continue;
        const r = el.getBoundingClientRect();
        const s = r.width * r.height * dpr * dpr;
        if (s > area) [area, layer] = [s, `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${Math.round(r.width * dpr)}×${Math.round(r.height * dpr)}`];
      }
      const gl = [...(window as unknown as { __gl: Set<HTMLCanvasElement> }).__gl].filter((c) => c.isConnected).length;
      return { pixels, area, layer, gl };
    });
    const at = `at y = ${Math.round(y)}`;
    expect(m.pixels, `${at}: decoded pixels`).toBeLessThanOrEqual(MAX_PIXELS);
    expect(m.area, `${at}: ${m.layer}`).toBeLessThanOrEqual(MAX_LAYER);
    expect(m.gl, `${at}: WebGL contexts`).toBeLessThanOrEqual(1);
    worst = {
      pixels: Math.max(worst.pixels, m.pixels),
      layer: m.area > worst.area ? m.layer : worst.layer,
      area: Math.max(worst.area, m.area),
      gl: Math.max(worst.gl, m.gl),
    };
  }
  console.log(`worst: ${(worst.pixels / 1e6).toFixed(1)} MP decoded, largest layer ${worst.layer}, ${worst.gl} WebGL`);
});
