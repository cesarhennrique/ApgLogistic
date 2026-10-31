import { test } from "@playwright/test";

test.use({ video: "on" });

// For review, not an assertion: scene 1 (from the moment it slides in over the hero) to the end of scene 3's script
// (the loaded truck), scrolled down, as e2e/__videos__/journey-<project>.webm (git-ignored).
// The intro is marked as seen, so the loader doesn't take the first seconds.
test("records the full scroll", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3_000);
  const [start, end] = await page.evaluate(() => {
    const top = (id: string) => document.getElementById(id)!.getBoundingClientRect().top + window.scrollY;
    // scene 3's script ends 120vh after it pins
    return [top("chegada") - window.innerHeight, top("carga") + 1.2 * window.innerHeight];
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start);
  await page.waitForTimeout(1_500);
  // ~36 s, in small steps (Lenis smooths between them).
  const steps = 360;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start + ((end - start) * i) / steps);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/journey-${testInfo.project.name}.webm`);
});
