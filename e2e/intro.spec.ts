import { expect, type Page, test } from "@playwright/test";

const loader = (page: Page) => page.locator("[data-loader]");

// The loader's exit has run and the hero's entrance (2.1 s) is over. Generous: software GL in parallel workers
// slows every frame, and these tests check layout, not timing.
async function introDone(page: Page) {
  await expect(loader(page)).toHaveAttribute("data-done", "", { timeout: 15_000 });
  await page.waitForTimeout(2_500);
}

test("the h1 is in the first HTML, before any script", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  expect(h1).not.toBeNull();
  expect(h1![1].replace(/<[^>]+>/g, "").replace(/<!-- -->/g, "")).toBe("Transportando confiança desde 1996");
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("there is no loader and the hero is complete", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/intro-(full|short)/);
    await expect(loader(page)).toBeHidden();
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('[data-intro="subtitle"]')).toBeVisible();
  });
});

// The map's projected box never crosses the copy's (spec §5 fixes from Prompt 13), and the routes stay in frame.
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
]) {
  test(`the map keeps clear of the copy at ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop viewports");
    await page.setViewportSize(viewport);
    await page.goto("/");
    await introDone(page);
    await expect.poll(() => page.evaluate(() => typeof (window as never as { __heroMapRect?: unknown }).__heroMapRect)).toBe("function");
    const map = await page.evaluate(() => (window as never as { __heroMapRect: () => DOMRect }).__heroMapRect());
    const copy = await page.locator("#hero-copy").boundingBox();
    expect(map && copy).toBeTruthy();
    expect(map.left).toBeGreaterThan(copy!.x + copy!.width);
    expect(map.right).toBeLessThanOrEqual(viewport.width);
    expect(map.top).toBeGreaterThanOrEqual(0);
    expect(map.bottom).toBeLessThanOrEqual(viewport.height);
  });
}

test("on mobile the map sits above the copy, whole", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "mobile layout");
  await page.goto("/");
  await introDone(page);
  // (phones, the 'low' tier: the map is the SVG one, its box the map's)
  const svg = (await page.locator("#hero [data-static-map=hero]").boundingBox())!;
  const map = { top: svg.y, bottom: svg.y + svg.height, left: svg.x, right: svg.x + svg.width };
  const copy = (await page.locator("#hero-copy").boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(map.bottom).toBeLessThan(copy.y);
  expect(map.left).toBeGreaterThanOrEqual(0);
  expect(map.right).toBeLessThanOrEqual(width);
});
