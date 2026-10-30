import { expect, type Page, test } from "@playwright/test";

// The loader marked as seen: these tests look at the scenes, not at the intro.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
});

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

// Scene 1's progress starts as it slides in over the hero (its top at the viewport's bottom).
async function scrollToArrival(page: Page, p: number) {
  await page.evaluate((progress) => {
    const scene = document.getElementById("chegada")!;
    const top = scene.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    window.scrollTo({ top: top + progress * scene.offsetHeight, behavior: "instant" });
  }, p);
}

// The hero's canvas mounts after the load event and an idle moment; then the scene's images and foam settle.
async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.locator("#hero canvas").waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(1500);
}

test("scene 1 shows the ocean and the ship, without console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  await scrollToArrival(page, 0.7);
  const ship = page.getByRole("img", { name: /Navio porta-contêineres/ });
  await expect(ship).toBeVisible();
  await expect.poll(() => ship.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  const ocean = page.locator("#chegada img[alt='']").first();
  await expect.poll(() => ocean.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("the only WebGL canvas is the hero's", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await expect(page.locator("#hero canvas")).toHaveCount(1);
  // Any other canvas (scene 1's foam) is 2D: a canvas holding a WebGL context returns null for "2d".
  const others = await page.evaluate(() =>
    [...document.querySelectorAll("canvas")].filter((c) => !c.closest("#hero")).map((c) => c.getContext("2d") !== null),
  );
  expect(others.every(Boolean)).toBe(true);
});

test("the header is light over the hero and the ocean, navy over the light scenes, solid after the journey", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  const header = page.locator("header");
  await expect(header).toHaveAttribute("data-tone", "light");
  await scrollToArrival(page, 0.7);
  await expect(header).toHaveAttribute("data-tone", "light");
  await page.evaluate(() => {
    const scene = document.getElementById("porteiner")!;
    window.scrollTo({ top: scene.getBoundingClientRect().top + window.scrollY + 10, behavior: "instant" });
  });
  await expect(header).toHaveAttribute("data-tone", "dark");
  await expect(header).not.toHaveAttribute("data-solid");

  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
  await expect(header).toHaveAttribute("data-solid", "true", { timeout: 15_000 });
});

// Art-direction review: five beats of scene 1, saved for a human to look at (not diffed).
test.describe("scene 1 frames", () => {
  for (const p of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    test(`chegada at ${p}`, async ({ page }, testInfo) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await settle(page);
      await scrollToArrival(page, p);
      // The foam builds up over a couple of seconds.
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-chegada-${p}.png` });
      expect(errors).toEqual([]);
    });
  }
});
