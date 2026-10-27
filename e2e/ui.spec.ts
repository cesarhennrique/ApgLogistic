import { expect, test } from "@playwright/test";

test("/dev/ui renders without console errors", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto("/dev/ui");
  await page.waitForLoadState("networkidle");
  await testInfo.attach("dev-ui", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  expect(errors).toEqual([]);
});

test("condensed title is under 75% of the normal width", async ({ page }, testInfo) => {
  await page.goto("/dev/ui");
  await page.evaluate(() => document.fonts.ready);
  const condensed = page.getByTestId("title-condensed");
  const normal = page.getByTestId("title-normal");
  await condensed.scrollIntoViewIfNeeded();

  const c = (await condensed.boundingBox())!.width;
  const n = (await normal.boundingBox())!.width;
  await testInfo.attach("typography", { body: await page.screenshot(), contentType: "image/png" });
  console.log(`${testInfo.project.name}: condensed ${c.toFixed(0)}px / normal ${n.toFixed(0)}px = ${((c / n) * 100).toFixed(1)}%`);
  expect(c / n).toBeLessThan(0.75);
});
