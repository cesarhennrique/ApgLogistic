import { expect, type Page, test } from "@playwright/test";

// The menu button is for screens under 1280 px (wider ones have the links inline): there, narrow the window.
async function underWide(page: Page) {
  const size = page.viewportSize()!;
  if (size.width >= 1280) await page.setViewportSize({ width: 1200, height: size.height });
}

test("menu opens and closes with the keyboard", async ({ page }) => {
  await underWide(page);
  await page.goto("/");
  const button = page.getByRole("button", { name: "Menu", exact: true });
  for (let i = 0; i < 15 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute("aria-controls", "site-menu");

  await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("dialog", { name: "Menu principal" });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link", { name: "Home" })).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeHidden();
  await expect(button).toBeFocused();
});

test("navigates to /sobre through the menu", async ({ page }) => {
  await underWide(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("dialog", { name: "Menu principal" }).getByRole("link", { name: "Sobre" }).click();
  // Curtain, then the dev server compiles /sobre on first hit while Home's 3D still loads the CPU.
  await expect(page).toHaveURL(/\/sobre$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Desde 1996, do porto ao destino" })).toBeVisible();
});

test("wide screens: the links inline, Serviços opening its list", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "1280 px and up");
  await page.goto("/");
  const nav = page.locator("header nav");
  await expect(page.getByRole("button", { name: "Menu", exact: true })).toBeHidden();
  await expect(nav.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  const services = nav.getByRole("button", { name: /Serviços/ });
  await services.click();
  await expect(services).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Containers Suape" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(services).toHaveAttribute("aria-expanded", "false");
  await nav.getByRole("link", { name: "Sobre" }).click();
  await expect(page).toHaveURL(/\/sobre$/, { timeout: 15_000 });
});
