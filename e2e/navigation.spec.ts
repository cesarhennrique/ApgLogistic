import { expect, test } from "@playwright/test";

test("menu opens and closes with the keyboard", async ({ page }) => {
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
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("dialog", { name: "Menu principal" }).getByRole("link", { name: "Sobre" }).click();
  await expect(page).toHaveURL(/\/sobre$/);
  await expect(page.getByRole("heading", { level: 1, name: "Sobre" })).toBeVisible();
});
