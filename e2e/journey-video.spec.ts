import { test } from "@playwright/test";

test.use({ video: "on" });

// For review, not an assertion: the hero to the end of scene 1 (the client's container), scrolled down, as
// e2e/__videos__/journey-<project>.webm (git-ignored).
// The intro is marked as seen, so the loader doesn't take the first seconds.
test("records the full scroll", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3_000);
  const end = await page.evaluate(() => {
    const scene = document.getElementById("chegada")!;
    return scene.getBoundingClientRect().top + window.scrollY + scene.offsetHeight - window.innerHeight;
  });
  // ~24 s from the top to the close, in small steps (Lenis smooths between them).
  const steps = 240;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (end * i) / steps);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/journey-${testInfo.project.name}.webm`);
});
