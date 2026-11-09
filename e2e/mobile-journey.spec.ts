import { expect, type Page, test } from "@playwright/test";

// The phone's journey (M3; MobileJourney): native scroll, nothing pinned; each scene a short video, its source only
// while near (two at most), playing once as it comes into view; the still of its last frame where it can't play.
// The desktop keeps its scenes (no video at all).

const CLIPS = ["navio", "porteiner", "carga", "estrada-a", "estrada-b"];

async function open(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.locator("video[data-clip]").first().waitFor({ state: "attached" });
}
const sources = (page: Page) => page.evaluate(() => [...document.querySelectorAll("video")].filter((v) => v.getAttribute("src")).length);

test.describe("on a phone", () => {
  test.skip(({ isMobile }) => !isMobile, "the phone's layout");

  test("each scene is a short muted inline video, none loaded before the page's load", async ({ page }) => {
    await open(page);
    const videos = page.locator("video[data-clip]");
    await expect(videos).toHaveCount(CLIPS.length);
    for (const [i, name] of CLIPS.entries()) {
      const v = videos.nth(i);
      // (scene 1's, a screen below the hero, preloads once the page is loaded)
      if (i > 0) await expect(v).toHaveAttribute("preload", "none");
      await expect(v).not.toHaveAttribute("autoplay");
      await expect(v).toHaveAttribute("playsinline", "");
      await expect(v).toHaveAttribute("width", "720");
      await expect(v).toHaveAttribute("poster", `/video/jornada/${name}-poster.webp`);
      expect(await v.evaluate((el: HTMLVideoElement) => el.muted)).toBe(true);
    }
    // the LCP's path clear: any video fetched only after the load event
    const early = await page.evaluate(() => {
      const load = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).loadEventStart;
      return performance
        .getEntriesByType("resource")
        .filter((r) => r.name.endsWith(".mp4") && r.startTime < load)
        .map((r) => r.name);
    });
    expect(early).toEqual([]);
    expect(await page.locator(".pin-spacer").count()).toBe(0);
    // the journey's scenes are there for the header and the links (#chegada)
    for (const id of ["chegada", "porteiner", "carga", "estrada", "distribuicao"]) await expect(page.locator(`#${id}`)).toBeAttached();
  });

  test("a video plays as it comes into view, two sources at most, paused out of view", async ({ page }) => {
    await open(page);
    const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    for (let y = 0; y <= end; y += 300) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(60);
      expect(await sources(page), `at y = ${y}`).toBeLessThanOrEqual(2);
    }
    // the crane's clip, well in view: it plays, then holds its last frame (its poster the last one)
    await page.locator("#porteiner video").evaluate((v) => v.scrollIntoView({ block: "end", behavior: "instant" }));
    const crane = page.locator("#porteiner video");
    await expect.poll(() => crane.evaluate((v: HTMLVideoElement) => !v.paused || v.ended)).toBe(true);
    await expect.poll(() => crane.evaluate((v: HTMLVideoElement) => v.ended), { timeout: 10_000 }).toBe(true);
    await expect(crane).toHaveAttribute("poster", "/video/jornada/porteiner-fim.webp");
    // out of view: paused
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => page.locator("#carga video").evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("where play() is refused (Low Power Mode), the last frame shows, with no error", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
    });
    await open(page);
    await page.locator("#chegada video").scrollIntoViewIfNeeded();
    await expect(page.locator("#chegada [data-clip-box]")).toHaveAttribute("data-still", "");
    await expect(page.locator("#chegada [data-clip-box] img")).toBeVisible();
    await expect.poll(() => page.locator("#chegada [data-clip-box] img").evaluate((i: HTMLImageElement) => i.naturalWidth)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("the container codes still run 01, 02, 03… in order", async ({ page }) => {
    await open(page);
    const codes = await page.locator("main").evaluate((main) => {
      const copy = main.cloneNode(true) as HTMLElement;
      // (as on the desktop: not the client's container card, the chapters, the services' panels after the first)
      for (const note of copy.querySelectorAll("[data-note], [data-chapter], [data-panel] ~ [data-panel], [data-door]")) note.remove();
      return [...copy.textContent!.matchAll(/APGU 1996-(\d{2})/g)].map((m) => Number(m[1]));
    });
    expect(codes.length).toBeGreaterThanOrEqual(9);
    expect(codes).toEqual(codes.map((_, i) => i + 1));
  });

  test("the header is light over the dark scenes, navy over the light ones", async ({ page }) => {
    await open(page);
    const header = page.locator("header");
    const to = (id: string) =>
      page.evaluate((id) => window.scrollTo({ top: document.getElementById(id)!.getBoundingClientRect().top + window.scrollY + 10, behavior: "instant" }), id);
    await to("chegada");
    await expect(header).toHaveAttribute("data-tone", "light");
    await to("porteiner");
    await expect(header).toHaveAttribute("data-tone", "dark");
    await to("distribuicao");
    await expect(header).toHaveAttribute("data-tone", "light");
  });

  test("with reduced motion every scene is its last frame, no video loaded", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page);
    await expect(page.locator("[data-clip-box][data-still]")).toHaveCount(CLIPS.length);
    await page.locator("#estrada").scrollIntoViewIfNeeded();
    expect(await sources(page)).toBe(0);
  });
});

test("the desktop keeps its scrubbed scenes, no video", async ({ page, isMobile }) => {
  test.skip(isMobile, "the desktop's layout");
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await expect(page.locator("#chegada[data-scene]")).toBeAttached();
  await expect(page.locator("video")).toHaveCount(0);
});
