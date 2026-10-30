import { test } from "@playwright/test";

// Small: the file is committed for review.
test.use({ video: { mode: "on", size: { width: 640, height: 400 } } });

// For review, not an assertion: the whole journey scrolled top to bottom, as e2e/__videos__/journey-<project>.webm.
// The intro is marked as seen, so the loader doesn't take the first seconds.
test("records the full scroll", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3_000);
  const end = await page.evaluate(() => {
    const track = document.getElementById("journey-track")!;
    return track.getBoundingClientRect().top + window.scrollY + track.offsetHeight;
  });
  // ~16 s top to bottom, in small steps (Lenis smooths between them).
  const steps = 160;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (end * i) / steps);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/journey-${testInfo.project.name}.webm`);
});
