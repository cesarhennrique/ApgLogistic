import { expect, test } from "@playwright/test";

test.use({ video: "on" });

// For review, not an assertion: the first visit (loader, then the hero's entrance) as
// e2e/__videos__/intro-<project>.webm.
test("records the first visit", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("[data-loader]")).toHaveAttribute("data-done", "", { timeout: 15_000 });
  await page.waitForTimeout(3_000);
  await page.close();
  await page.video()!.saveAs(`e2e/__videos__/intro-${testInfo.project.name}.webm`);
});
