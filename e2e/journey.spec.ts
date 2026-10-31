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

// Scene 1's progress (0–1): from the moment it starts sliding in over the hero (its top at the viewport's bottom)
// to its end. The camera moves from 0.
async function scrollToArrival(page: Page, q: number) {
  await page.evaluate((progress) => {
    const scene = document.getElementById("chegada")!;
    const top = scene.getBoundingClientRect().top + window.scrollY - window.innerHeight;
    window.scrollTo({ top: top + progress * scene.offsetHeight, behavior: "instant" });
  }, q);
}

// The hero's canvas mounts after the load event and an idle moment.
async function settle(page: Page) {
  await page.waitForLoadState("load");
  await page.locator("#hero canvas").waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(1500);
}

// Every image of scene 1 that has a source in, the close's original included (desktop only).
async function imagesIn(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement>("#chegada img")]
          .filter((i) => i.getAttribute("src"))
          .every((i) => i.complete && i.naturalWidth > 0),
      ),
    )
    .toBe(true);
}

const photo = (page: Page) => page.getByRole("img", { name: /Navio porta-contêineres/ });
// The camera's scale: the photo box's transform.
const cameraScale = (page: Page) =>
  photo(page).evaluate((img) => new DOMMatrix(getComputedStyle(img.closest("picture")!.parentElement!).transform).a);
// How shown one of scene 1's notes is (heading, containers, target): its group's opacity.
const noteOpacity = (page: Page, note: string) =>
  page.locator(`#chegada [data-note=${note}]`).evaluate((el) => Number(getComputedStyle(el).opacity));

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

test("no dead scroll: from the moment scene 1 slides in to the close, every 10vh of scroll changes the zoom", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  await settle(page);
  // The close: the camera's progress at 0.8 (oceanCamera's ZOOM).
  const step = await page.evaluate(() => (0.1 * window.innerHeight) / document.getElementById("chegada")!.offsetHeight);
  let previous = 0;
  for (let q = 0; q <= 0.8 + 1e-9; q += step) {
    await scrollToArrival(page, q);
    await page.waitForTimeout(120);
    const scale = await cameraScale(page);
    expect(scale, `q = ${q.toFixed(3)}`).toBeGreaterThan(previous);
    previous = scale;
  }
});

test("each note shows in its stretch only: the heading, the APG containers, the client's container", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const shown = async (q: number) => {
    await scrollToArrival(page, q);
    await page.waitForTimeout(300);
    const [heading, containers, target] = await Promise.all(["heading", "containers", "target"].map((n) => noteOpacity(page, n)));
    return { heading, containers, target };
  };
  // a. the whole ship, heading to Suape
  expect(await shown(0.01)).toMatchObject({ heading: 1, containers: 0, target: 0 });
  // b. the deck filling the screen
  expect(await shown(0.5)).toMatchObject({ heading: 0, containers: 1, target: 0 });
  // c. the close, held to the end
  expect(await shown(0.85)).toMatchObject({ heading: 0, containers: 0, target: 1 });
  expect(await shown(1)).toMatchObject({ heading: 0, containers: 0, target: 1 });
  expect(errors).toEqual([]);
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

// The hero's copy sits in the middle of the screen left between the header and the strip, at three sizes; the frames
// are saved for a human to look at.
test("the hero's copy is centred below the header", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the sizes are set here");
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await settle(page);
    const { above, below } = await page.evaluate(() => {
      const copy = document.getElementById("hero-copy")!.getBoundingClientRect();
      const header = document.querySelector("header")!.getBoundingClientRect();
      const strip = document.querySelector("#hero [data-intro=strip]")?.getBoundingClientRect();
      return { above: copy.top - header.bottom, below: (strip?.top ?? window.innerHeight) - copy.bottom };
    });
    expect(Math.abs(above - below), `${width}×${height}: ${above} above, ${below} below`).toBeLessThan(24);
    await page.screenshot({ path: `e2e/__screenshots__/hero-${width}x${height}.png` });
  }
});

// Art-direction review: five points of scene 1, saved for a human to look at (not diffed).
test.describe("scene 1 frames", () => {
  for (const q of [0, 0.25, 0.5, 0.75, 1]) {
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
