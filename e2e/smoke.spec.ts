import { expect, test } from "@playwright/test";

test("home loads with h1 and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));

  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(
    page.getByRole("heading", { level: 1, name: "Transportando confiança desde 1996" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("home shows the 3 services and counts up to 1.900", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Containers Suape", "Operação Bahia", "Logística e Armazenagem"]) {
    await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  }
  const stats = page.getByRole("heading", { level: 2, name: "A operação em números" });
  await stats.scrollIntoViewIfNeeded();
  // exact match hits the animated (visible) span, not the sr-only "1.900 TEUs"
  await expect(page.getByText("1.900", { exact: true })).toBeVisible();
});

test("home has no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("the Ç of CONFIANÇA stays inside its line mask", async ({ page }) => {
  await page.goto("/");
  const h1 = page.locator("h1[data-reveal-immediate]");
  // Polled: the line is still settling while the reveal (and the re-split on font load) runs.
  // Without the mask padding the glyph box never fits, so this times out.
  await expect
    .poll(() =>
      h1.evaluate((el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const i = node.textContent!.toUpperCase().indexOf("Ç");
          if (i < 0) continue;
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const glyph = range.getBoundingClientRect();
          const mask = node.parentElement!.closest(".reveal-line-mask")?.getBoundingClientRect();
          return !!mask && glyph.top >= mask.top && glyph.bottom <= mask.bottom;
        }
        return false;
      }),
    )
    .toBe(true);
});
