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

// Scene 1's camera progress (0–1): it runs once the scene has slid in over the hero (its top at the viewport's top)
// until its end.
async function scrollToArrival(page: Page, q: number) {
  await page.evaluate((progress) => {
    const scene = document.getElementById("chegada")!;
    const top = scene.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + progress * (scene.offsetHeight - window.innerHeight), behavior: "instant" });
  }, q);
}

// The hero's canvas mounts after the load event and an idle moment.
async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.locator("#hero canvas").waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(1500);
}

// Every image of scene 1 in, the close's original included (desktop).
async function imagesIn(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => [...document.querySelectorAll<HTMLImageElement>("#chegada img")].every((i) => i.complete && i.naturalWidth > 0)),
    )
    .toBe(true);
}

const photo = (page: Page) => page.getByRole("img", { name: /Navio porta-contêineres/ });
// The camera's scale: the photo box's transform.
const cameraScale = (page: Page) =>
  photo(page).evaluate((img) => new DOMMatrix(getComputedStyle(img.closest("picture")!.parentElement!).transform).a);

test("scene 1 renders the photo, without foam canvas or console errors", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  await scrollToArrival(page, 0.5);
  await expect(photo(page)).toBeVisible();
  await imagesIn(page);
  await expect(page.locator("#chegada canvas")).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("scrolling zooms the camera in: the photo's transform scales up", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  const scaleAt = async (q: number) => {
    await scrollToArrival(page, q);
    await page.waitForTimeout(400);
    return cameraScale(page);
  };
  const wide = await scaleAt(0.05);
  const mid = await scaleAt(0.5);
  const close = await scaleAt(0.95);
  expect(mid).toBeGreaterThan(wide * 1.2);
  expect(close).toBeGreaterThan(mid * 1.2);
});

test("the only canvas is the hero's WebGL map", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await expect(page.locator("#hero canvas")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
});

test("the Home's container codes run 01, 02, 03… in order, without repeats", async ({ page }) => {
  await page.goto("/");
  const codes = await page
    .locator("main")
    .evaluate((main) => [...main.textContent!.matchAll(/APGU 1996-(\d{2})/g)].map((m) => Number(m[1])));
  expect(codes.length).toBeGreaterThanOrEqual(10);
  expect(codes).toEqual(codes.map((_, i) => i + 1));
});

test("the header is light over the hero and scene 1, navy over the light scenes, solid after the journey", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  const header = page.locator("header");
  await expect(header).toHaveAttribute("data-tone", "light");
  await scrollToArrival(page, 0.5);
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

// Art-direction review: five points of scene 1's camera, saved for a human to look at (not diffed).
test.describe("scene 1 frames", () => {
  for (const q of [0, 0.3, 0.5, 0.75, 1]) {
    test(`chegada at ${q}`, async ({ page }, testInfo) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await settle(page);
      await scrollToArrival(page, q);
      await imagesIn(page);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-chegada-${q}.png` });
      expect(errors).toEqual([]);
    });
  }
});
