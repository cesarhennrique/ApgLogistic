import { expect, type Page, test } from "@playwright/test";

// ?p freezes the 3D, not the page: scroll to where p sits in the track, so the page shows what a visitor
// sees there (hero gone, chapter text up).
async function scrollToProgress(page: Page, p: number) {
  await page.evaluate((progress) => {
    const track = document.getElementById("journey-track")!;
    const top = track.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + progress * (track.offsetHeight - window.innerHeight), behavior: "instant" });
  }, p);
}

// Not "networkidle": the 3D text (troika: the hero map's labels, the highway sign) runs a worker whose blob: script
// Playwright counts as a request that never finishes. Load, then give the scene's textures, map and font a moment.
// The canvas itself mounts only after the load event and an idle moment (JourneyStage).
async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.locator("#journey canvas").waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(2500);
}

test("/?p=0.5 renders the journey canvas without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/?p=0.5");
  await expect(page.locator("#journey canvas")).toHaveCount(1, { timeout: 15_000 });
  // p=0.5 sits in the highway chapter, so only its text is active.
  await expect(page.locator("#journey-track [data-active]")).toHaveAttribute("data-chapter", "highway");
  await settle(page);
  expect(errors).toEqual([]);
});

test("the header stays see-through over the journey and turns solid after it", async ({ page }) => {
  await page.goto("/?p=0.3");
  await expect(page.locator("#journey canvas")).toHaveCount(1, { timeout: 15_000 });
  await scrollToProgress(page, 0.3);
  const header = page.locator("header");
  // Give the scroll listener and the observer a beat, then check it stayed off.
  await page.waitForTimeout(500);
  await expect(header).not.toHaveAttribute("data-solid");

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  // The first environment bake (shader recompiles) can hold the main thread for seconds in software GL.
  await expect(header).toHaveAttribute("data-solid", "true", { timeout: 15_000 });
});

// Art-direction review: one frame per chapter beat, saved for a human to look at (not diffed).
// One after another: each frame renders the full port or terminal in software GL, and seven at once starve
// the other workers' timing-sensitive tests.
test.describe("journey frames", () => {
  test.describe.configure({ mode: "default" });

  for (const p of [0, 0.02, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9]) {
    test(`/?p=${p} journey frame`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(`/?p=${p}`);
      // Lazy chunk + WebGL init; under a loaded CPU WebKit can take longer than the default 5 s.
      await expect(page.locator("#journey canvas")).toHaveCount(1, { timeout: 15_000 });
      await settle(page);
      // Otherwise the hero's gradient would sit over every frame.
      if (p > 0) await scrollToProgress(page, p);
      // Canvas fade-in (600 ms) plus the water texture settling.
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-p${p}.png` });
      expect(errors).toEqual([]);
    });
  }
});
