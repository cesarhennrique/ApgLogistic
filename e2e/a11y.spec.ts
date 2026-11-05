import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES } from "./pages";

// Spec §6 "Acessibilidade": WCAG 2.1 AA on every route. With reduced motion every section is at rest (no intro, no
// scroll choreography), so axe sees the whole page as it reads.
const ROUTES = ["/", ...PAGES.map((p) => p.path), "/privacidade"];

test.use({ reducedMotion: "reduce" });

for (const route of ROUTES) {
  test(`axe: no serious or critical violations on ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("load");
    // the header's ink follows the section under it (an observer's first callback, right after hydration)
    await page.waitForFunction(() => document.querySelector("header")?.dataset.tone);
    // and the reveals' fades (reduced motion) done
    await page.waitForFunction(() => [...document.querySelectorAll("[data-reveal-immediate]")].every((el) => getComputedStyle(el).opacity === "1"));
    // [data-decor]: the giant words behind the sections, pure decoration (WCAG 1.4.3 exempts it from contrast)
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .exclude("[data-decor]")
      .analyze();
    const bad = violations
      .filter((v) => v.impact === "serious" || v.impact === "critical")
      .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join(", ")}`);
    expect(bad).toEqual([]);
  });
}

test("every route is in pt-BR, with a title of its own", async ({ page }) => {
  const titles: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    titles.push(await page.title());
  }
  expect(new Set(titles).size).toBe(ROUTES.length);
});

test("the first Tab shows the skip link, which lands in the page's main", async ({ page, browserName, isMobile }) => {
  test.skip(isMobile, "no keyboard on a phone");
  test.skip(browserName === "webkit", "WebKit's Tab skips links (Safari's default, Option+Tab there; not on Windows)");
  for (const route of ["/", "/sobre"]) {
    await page.goto(route);
    await page.waitForLoadState("load");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("main#conteudo")).toBeFocused();
  }
});

test("the whole Home is reachable by keyboard, every stop visible", async ({ page, browserName, isMobile }) => {
  test.skip(isMobile, "no keyboard on a phone");
  test.skip(browserName === "webkit", "WebKit's Tab skips links (Safari's default, Option+Tab there; not on Windows)");
  test.setTimeout(120_000);
  await page.goto("/");
  await page.waitForLoadState("load");
  const stops: string[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    // past the fades (200 ms) of what shows on focus
    await page.waitForTimeout(300);
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el.closest("nextjs-portal") || el.tagName === "NEXTJS-PORTAL") return null;
      let opacity = 1;
      for (let e: HTMLElement | null = el; e; e = e.parentElement) opacity *= Number(getComputedStyle(e).opacity);
      const r = el.getBoundingClientRect();
      const name = el.getAttribute("aria-label") || el.textContent?.trim() || "";
      return { name, visible: opacity > 0.9 && r.bottom > 0 && r.top < innerHeight };
    });
    if (!stop) break;
    expect.soft(stop.visible, `focus visible on "${stop.name}"`).toBe(true);
    stops.push(stop.name);
  }
  // the footer's last link at the end; "Solicitar cotação" thrice:
  // header, hero and the container (whose contacts are out of sight until its doors open)
  expect(stops.filter((s) => s === "Solicitar cotação").length).toBe(3);
  expect(stops.some((s) => s.includes("3202-1800"))).toBe(true);
  expect(stops.at(-1)).toBe("Política de Privacidade");
});
