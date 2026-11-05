import { expect, test } from "@playwright/test";

// Without WebGL (Chromium's --disable-webgl, on every project) the quality tier is 'static' (lib/quality): the Home
// creates no canvas and shows its maps as still pictures, the hero's and the distribution's.
test.use({ browserName: "chromium", launchOptions: { args: ["--disable-webgl"] } });

test("without WebGL: no canvas, the maps still", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(2500);
  await expect(page.locator('#hero [data-static-map="hero"]')).toBeVisible();
  await page.locator("#distribuicao").scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const s = document.getElementById("distribuicao")!;
    window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY + window.innerHeight, behavior: "instant" });
  });
  await page.waitForTimeout(1500);
  await expect(page.locator('#distribuicao [data-static-map="distribution"]')).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  expect(errors).toEqual([]);
});
