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
