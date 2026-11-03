import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// The internal pages (spec §4): a hero (photo, navy gradient, the title), no WebGL canvas, no console errors (their
// image budget: budget.spec.ts). Each saved whole, for a human to look at.
for (const { path, h1 } of PAGES) {
  test(`${path}: its hero, no canvas, no errors`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible();
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    await expect(page.locator("canvas")).toHaveCount(0);
    // the hero's image painted
    await expect
      .poll(() => page.locator("main section").first().locator("img").first().evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0))
      .toBe(true);
    await page.screenshot({ path: `e2e/__screenshots__/pages/${testInfo.project.name}${path.replaceAll("/", "-")}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}
