import { expect, test } from "@playwright/test";

// The Home's scroll on a phone (spec §6; M2): Chromium as an iPhone 14 (390×844, 3×, touch), the CPU 4× slower,
// the whole Home dragged by touch down and back up. Per scene: the 95th percentile frame ≤ 20 ms (M3: no frame
// dropped at 60 Hz, frames coming at multiples of 16.7 ms), no frame past 100 ms, no long task (> 50 ms) on the main
// thread;
// back at the top, the hero's map shows at once. Against the production build (the "smoothness" project in
// playwright.config.ts: development React alone would fail it), on the GPU (a 2D canvas drawn in software, as
// headless does, costs a copy every frame that no phone pays).

test("the Home scrolls smoothly on a phone, down and back up", async ({ page, context }) => {
  test.setTimeout(300_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(4000);

  // every frame, tagged by the scene under the screen's middle and the scroll's direction; every long task
  await page.evaluate(() => {
    const w = window as unknown as { __frames: [number, string][]; __long: [number, string][]; __scene: string };
    w.__frames = [];
    w.__long = [];
    w.__scene = "";
    let last = performance.now();
    let y = scrollY;
    const loop = (t: number) => {
      const mid = innerHeight / 2;
      const s = [...document.querySelectorAll("main section, footer")].findLast((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= mid && r.bottom >= mid;
      });
      w.__scene = `${s?.id || s?.getAttribute("aria-labelledby") || s?.tagName.toLowerCase() || "?"} ${scrollY >= y ? "↓" : "↑"}`;
      y = scrollY;
      w.__frames.push([t - last, w.__scene]);
      last = t;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__long.push([e.duration, w.__scene]);
    }).observe({ type: "longtask", buffered: false });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  // a touch drag: 500 px over 20 moves a frame apart (≈1500 px/s)
  const drag = async (dy: number) => {
    const [x, y0] = [200, dy < 0 ? 700 : 150];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 20; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y0 + (dy * i) / 20 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let guard = 0; guard < 200 && (await page.evaluate(() => scrollY)) < end - 1; guard++) await drag(-500);
  await page.waitForTimeout(500);
  for (let guard = 0; guard < 200 && (await page.evaluate(() => scrollY)) > 0; guard++) await drag(500);

  // back at the top: the hero's map there at once, never an empty frame
  await expect(page.locator("#hero [data-static-map], #hero canvas:not([data-photo])").first()).toBeVisible({ timeout: 100 });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

  const { frames, long } = await page.evaluate(() => {
    const w = window as unknown as { __frames: [number, string][]; __long: [number, string][] };
    return { frames: w.__frames.slice(1), long: w.__long };
  });
  const by = new Map<string, number[]>();
  for (const [dt, scene] of frames) by.set(scene, [...(by.get(scene) ?? []), dt]);
  for (const [scene, dts] of by) {
    if (dts.length < 10) continue;
    const sorted = [...dts].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(0.95 * sorted.length)];
    console.log(`${scene.padEnd(22)} p95 ${p95.toFixed(1)} ms, max ${Math.max(...dts).toFixed(0)} ms, ${dts.length} frames`);
    expect.soft(p95, `${scene}: 95th percentile frame`).toBeLessThanOrEqual(20);
    expect.soft(Math.max(...dts), `${scene}: longest frame`).toBeLessThanOrEqual(100);
  }
  expect(long.map(([ms, scene]) => `${Math.round(ms)} ms in ${scene}`)).toEqual([]);
});
