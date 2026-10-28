import { expect, test } from "@playwright/test";

test("/?p=0.5 renders the journey canvas without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/?p=0.5");
  await expect(page.locator("#journey canvas")).toHaveCount(1);
  // p=0.5 sits in the highway chapter, so only its text is active.
  await expect(page.locator("#journey-track [data-active]")).toHaveAttribute("data-chapter", "highway");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

// Art-direction review: one frame per chapter beat, saved for a human to look at (not diffed).
// One after another: each frame renders the full port or terminal in software GL, and seven at once starve
// the other workers' timing-sensitive tests.
test.describe("journey frames", () => {
  test.describe.configure({ mode: "default" });

  for (const p of [0, 0.15, 0.3, 0.5, 0.7, 0.8, 1]) {
    test(`/?p=${p} journey frame`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(`/?p=${p}`);
      await expect(page.locator("#journey canvas")).toHaveCount(1);
      await page.waitForLoadState("networkidle");
      // Canvas fade-in (600 ms) plus the water texture settling.
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-p${p}.png` });
      expect(errors).toEqual([]);
    });
  }
});
