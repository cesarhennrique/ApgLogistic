import { expect, test } from "@playwright/test";

// In Chromium on every project (the phone one keeps its screen, its dpr and its user agent): Playwright's WebKit on
// Windows decodes no AVIF and falls back to the WebP, which phones' Safari (iOS 16+) does not need.
test.use({ browserName: "chromium" });

// The Home's image budget (spec: ≤ 2 MB on desktop, ≤ 1 MB on phones): every image downloaded over a scroll from the
// top to the footer in a fresh context (nothing cached), their bodies' bytes. The heaviest are printed, for the record.
test("the Home's images stay within budget over a full scroll", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
  const images: { url: string; bytes: number }[] = [];
  page.on("requestfinished", async (request) => {
    if (request.resourceType() !== "image") return;
    images.push({ url: request.url(), bytes: (await request.sizes()).responseBodySize });
  });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(2000);
  const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= end; y += 200) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(3000);
  const list = images.sort((a, b) => b.bytes - a.bytes);
  const total = list.reduce((sum, i) => sum + i.bytes, 0);
  console.log(`${testInfo.project.name}: ${Math.round(total / 1024)} KB of images`);
  for (const i of list.slice(0, 8)) console.log(`  ${Math.round(i.bytes / 1024)} KB ${new URL(i.url).pathname}`);
  expect(total).toBeLessThanOrEqual((testInfo.project.name === "mobile" ? 1 : 2) * 1024 * 1024);
});
