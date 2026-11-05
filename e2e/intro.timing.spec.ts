import { expect, type Page, test } from "@playwright/test";

// Runs in its own Playwright projects, after the others (playwright.config.ts): a timing measured while two more
// software-GL pages compete for the CPU says nothing about the loader.
const loader = (page: Page) => page.locator("[data-loader]");

// The loader's exit has run and the hero's entrance (2.1 s) is over.
async function introDone(page: Page) {
  await expect(loader(page)).toHaveAttribute("data-done", "", { timeout: 8_000 });
  await page.waitForTimeout(2_500);
}

test("the first visit shows the loader, done in under 4 s; the next one in the session skips it", async ({ page }) => {
  await page.goto("/");
  await expect(loader(page)).toBeVisible();
  await expect(loader(page)).toHaveAttribute("data-leaving", /\d+/, { timeout: 8_000 });
  // How long the loader was on screen before the curtain started lifting (the GSAP exit, or the compositor failsafe if
  // the main thread was stuck), counted from when its stylesheet showed it: the failsafe's own clock. From navigation
  // start, a stylesheet arriving late (the dev server's chunk) ate the 200 ms between the failsafe and the 4 s.
  const onScreen = await loader(page).evaluate((el) => {
    const css = el.getAnimations().find((a) => (a as CSSAnimation).animationName === "loader-failsafe");
    const shown = css?.startTime != null ? Number(css.startTime) : 0;
    const delay = css ? Number(css.effect?.getTiming().delay ?? 0) : Infinity;
    return Math.min(Number(el.dataset.leaving) - shown, delay);
  });
  expect(onScreen).toBeLessThan(4_000);
  await introDone(page);
  await expect(loader(page)).toBeHidden();
  await expect(page.locator("h1")).toBeVisible();

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/intro-short/);
  await expect(loader(page)).toBeHidden();
  await expect(page.locator("h1")).toBeVisible();
});
