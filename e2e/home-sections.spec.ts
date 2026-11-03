import { expect, type Page, test } from "@playwright/test";

// The Home's sections after the journey (spec §4), in the journey's language: the services' sideways track (wide
// screens) or stacked panels (phones), the reasons with their little pictures, the final call's container opening.
// Three points of each are saved for a human to look at.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
});

const SERVICES = "section[aria-labelledby=services-title]";
const REASONS = "section:has(> div > ul.grid)";
const CTA = "section:has([data-door])";

async function open(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(1500);
}
// The scroll at a share p of a section's own scroll (its top at the top to its bottom at the bottom); for a section
// no taller than the screen, p of a screen from its top.
async function scrollToSection(page: Page, selector: string, p: number) {
  await page.evaluate(
    ([selector, p]) => {
      const s = document.querySelector(selector)!;
      const top = s.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + p * Math.max((s as HTMLElement).offsetHeight - innerHeight, innerHeight), behavior: "instant" });
    },
    [selector, p] as const,
  );
  await page.waitForTimeout(1200);
}
const shot = (page: Page, name: string) => page.screenshot({ path: `e2e/__screenshots__/home/${test.info().project.name}-${name}.png` });

test("the services: three panels, sideways and counted on wide screens, stacked on phones", async ({ page }, testInfo) => {
  await open(page);
  const panels = page.locator(`${SERVICES} [data-panel]`);
  await expect(panels).toHaveCount(3);
  const wide = testInfo.project.name !== "mobile";
  for (const [i, p] of [0, 0.5, 1].entries()) {
    await scrollToSection(page, SERVICES, p);
    if (wide) {
      // the panel in view is the i-th: its left edge on the screen's
      const left = await panels.nth(i).evaluate((el) => el.getBoundingClientRect().left);
      expect(Math.abs(left)).toBeLessThan(4);
    }
    await shot(page, `services-${p}`);
  }
  if (!wide) {
    // no sideways track: the three one under the other, each object in once its panel shows
    const tops = await panels.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top + window.scrollY));
    expect(tops[1]).toBeGreaterThan(tops[0]);
    expect(tops[2]).toBeGreaterThan(tops[1]);
    await expect(panels.nth(2)).toHaveAttribute("data-in", "");
  }
});

test("the reasons: each little picture plays as it comes in, the clock on Recife's time", async ({ page }) => {
  await open(page);
  for (const [k, p] of [-0.6, 0, 0.6].entries()) {
    await scrollToSection(page, REASONS, p);
    await shot(page, `reasons-${k}`);
  }
  const cells = page.locator(`${REASONS} ul.grid > li`);
  await expect(cells).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await cells.nth(i).scrollIntoViewIfNeeded();
    await expect(cells.nth(i)).toHaveAttribute("data-in", "");
  }
  await expect(page.locator(REASONS).getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();
});

test("the final call: the container's doors open and the contacts come out", async ({ page }) => {
  await open(page);
  const doors = page.locator("[data-door]");
  const angle = () => doors.first().evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m13));
  const container = page.locator("[data-door]").first().locator("..");
  const at = async (k: number) => {
    await page.evaluate((k) => {
      const box = document.querySelector("[data-door]")!.parentElement!;
      window.scrollTo({ top: box.getBoundingClientRect().top + window.scrollY - k * innerHeight, behavior: "instant" });
    }, k);
    await page.waitForTimeout(2200);
  };
  await at(0.95);
  await shot(page, "cta-0");
  expect(await angle()).toBeLessThan(0.2);
  await at(0.45);
  await shot(page, "cta-1");
  await at(0.05);
  await shot(page, "cta-2");
  // open (sin of the swing near 1), the quote and the phone out and reachable
  expect(await angle()).toBeGreaterThan(0.9);
  await expect(container.getByRole("link", { name: "Solicitar cotação" })).toBeVisible();
  await expect(container.getByRole("link", { name: /3202-1800/ })).toBeVisible();
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("each section stands still in its end state", async ({ page }) => {
    await open(page);
    // services: no track, no pin (the three panels, a screen or so each)
    const services = (await page.locator(SERVICES).boundingBox())!;
    const vh = await page.evaluate(() => innerHeight);
    expect(services.height).toBeLessThan(4 * vh);
    // the container open, its contacts out
    await page.locator(CTA).scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const m13 = await page.locator("[data-door]").first().evaluate((el) => Math.abs(new DOMMatrix(getComputedStyle(el).transform).m13));
    expect(m13).toBeGreaterThan(0.9);
    await expect(page.locator(CTA).getByRole("link", { name: "Solicitar cotação" })).toBeVisible();
  });
});
