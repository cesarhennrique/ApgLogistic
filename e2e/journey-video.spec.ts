import { test } from "@playwright/test";

test.use({ video: "on" });

// For review, not an assertion: scene 3 (from the moment it slides in over scene 2) through scene 4, the road, to
// the start of Distribution, scrolled down, as e2e/__videos__/journey-<project>.webm (git-ignored).
// The intro is marked as seen, so the loader doesn't take the first seconds.
test("records the full scroll", async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3_000);
  const [start, end] = await page.evaluate(() => {
    const top = (id: string) => document.getElementById(id)!.getBoundingClientRect().top + window.scrollY;
    return [top("carga") - window.innerHeight, top("distribuicao")];
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start);
  await page.waitForTimeout(1_500);
  // ~60 s, in small steps (Lenis smooths between them).
  const steps = 600;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start + ((end - start) * i) / steps);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/journey-${testInfo.project.name}.webm`);
});

// For review: phase B of scene 4 alone (the camera rising from the side view to above), slowly, as
// e2e/__videos__/estrada-b-<project>.webm (git-ignored).
test("records scene 4's camera rising, slowly", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3_000);
  const [start, end] = await page.evaluate(() => {
    const s = document.getElementById("estrada")!;
    const top = s.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    // B: after the slide (100vh) and A (300vh), 150vh (×0.75 on phones)
    const k = window.innerWidth < 768 ? 0.75 : 1;
    const vh = s.offsetHeight / (100 + 1070 * k);
    return [top + (100 + 300 * k) * vh, top + (100 + 450 * k) * vh];
  });
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start);
  await page.waitForTimeout(2_000);
  // ~30 s for the phase
  const steps = 300;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), start + ((end - start) * i) / steps);
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(1_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/estrada-b-${testInfo.project.name}.webm`);
});
