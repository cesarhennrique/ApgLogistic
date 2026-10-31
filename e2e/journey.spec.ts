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

// The header's tone has finished its fade (after a jump from the hero to a light scene it changes, over 200 ms; under
// the test's load that can take a while): a frame taken mid-fade shows a grey band behind it.
async function headerSettled(page: Page) {
  await expect
    .poll(() => page.locator("header > div").nth(1).evaluate((el) => getComputedStyle(el).opacity))
    .toMatch(/^(0|1)$/);
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

const photo = (page: Page) => page.locator("#chegada").getByRole("img", { name: /Navio porta-contêineres/ });
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

// What scene 1 shows, in one string: the camera, the HUD's position, the heading's dashes, the sonar, the outlines,
// the sight and the count (every layer that moves with the scroll).
const sceneOneState = (page: Page) =>
  page.locator("#chegada").evaluate((scene) => {
    const t = (el: Element | null) => (el ? `${getComputedStyle(el).transform}|${getComputedStyle(el).opacity}` : "");
    return [
      t(scene.querySelector("[data-photo]")),
      scene.querySelector("[data-hud-coords]")?.textContent,
      t(scene.querySelector("[data-hud]")),
      ...[...scene.querySelectorAll("[data-route] i")].map((d) => getComputedStyle(d).transform),
      ...[...scene.querySelectorAll("[data-sonar], [data-outline], [data-outline] i, [data-note], [data-note] [data-bar], [data-note] [data-label]")].map(t),
      scene.querySelector(".tabular-nums")?.textContent,
    ].join(";");
  });

test("no dead scroll: from the moment scene 1 slides in to the close, every 10vh of scroll changes what it shows", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await settle(page);
  // To the card's arrival (0.93): after it the close holds.
  const step = await page.evaluate(() => (0.1 * window.innerHeight) / document.getElementById("chegada")!.offsetHeight);
  let previous = "";
  for (let q = 0; q <= 0.93 + 1e-9; q += step) {
    await scrollToArrival(page, q);
    // (polled: under the test's load the scrubbed trigger can take a few frames to catch up)
    await expect.poll(() => sceneOneState(page), { message: `q = ${q.toFixed(3)}` }).not.toBe(previous);
    previous = await sceneOneState(page);
  }
});

test("each layer shows in its stretch only: the HUD, the heading, the APG containers, the client's container", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const shown = async (q: number) => {
    await scrollToArrival(page, q);
    await page.waitForTimeout(300);
    const [heading, containers, target] = await Promise.all(["heading", "containers", "target"].map((n) => noteOpacity(page, n)));
    const hud = await page.locator("#chegada [data-hud]").evaluate((el) => Number(getComputedStyle(el).opacity));
    return { hud, heading, containers, target };
  };
  // 0–20%: the HUD over the whole ship
  expect(await shown(0.1)).toMatchObject({ hud: 1, heading: 0, containers: 0, target: 0 });
  // 20–45%: the heading at the bow
  expect(await shown(0.33)).toMatchObject({ hud: 1, heading: 1, containers: 0, target: 0 });
  // 45–75%: the APG containers
  expect(await shown(0.6)).toMatchObject({ hud: 1, heading: 0, containers: 1, target: 0 });
  // 75–100%: the client's container, held to the end
  expect(await shown(0.95)).toMatchObject({ hud: 0, heading: 0, containers: 0, target: 1 });
  expect(await shown(1)).toMatchObject({ hud: 0, heading: 0, containers: 0, target: 1 });
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
    // (the sections' codes: not the container code on scene 1's card, a note on the photo)
    .evaluate((main) => {
      const copy = main.cloneNode(true) as HTMLElement;
      for (const note of copy.querySelectorAll("[data-note]")) note.remove();
      return [...copy.textContent!.matchAll(/APGU 1996-(\d{2})/g)].map((m) => Number(m[1]));
    });
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

// The hero's copy: on wide screens in the middle of the screen left between the header and the pillars; on phones
// at the bottom, just above them, over the photo's darker foot. At three sizes; the frames are saved for a human to
// look at.
test("the hero's copy is centred below the header (at the bottom on phones)", async ({ page }, testInfo) => {
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
      const top = copy.top;
      const header = document.querySelector("header")!.getBoundingClientRect();
      const strip = document.querySelector("#hero [data-intro=strip]")?.getBoundingClientRect();
      return { above: top - header.bottom, below: (strip?.top ?? window.innerHeight) - copy.bottom };
    });
    if (width >= 768) expect(Math.abs(above - below), `${width}×${height}: ${above} above, ${below} below`).toBeLessThan(24);
    else expect(below, `${width}×${height}: ${below} below`).toBeLessThan(40);
    await page.screenshot({ path: `e2e/__screenshots__/hero-${width}x${height}.png` });
  }
});

// Art-direction review: five points of scene 1, saved for a human to look at (not diffed).
test.describe("scene 1 frames", () => {
  for (const q of [0.1, 0.3, 0.6, 0.9]) {
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

// Scenes 2 and 3 (spec §3): the progress of a pinned scene, from its top at the viewport's top to its end.
async function scrollToScene(page: Page, id: string, p: number) {
  await page.evaluate(
    ([id, progress]) => {
      const scene = document.getElementById(id)!;
      const top = scene.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + progress * (scene.offsetHeight - window.innerHeight), behavior: "instant" });
    },
    [id, p] as const,
  );
}

// The camera follows the load, so it is measured in the crane's picture (its offset under the trolley), and the
// camera's scale shows the pull-back to the whole crane.
// Scene 2's script runs over its first 160vh of 260 (then scene 3 slides in over its close): its progress c is
// the scroll's p over SCENE2_SCRIPT.
const SCENE2_SCRIPT = 160 / 260;

// The camera follows the load, so it is measured in the crane's picture (its offset under the trolley), and the
// camera's scale shows the zoom in.
test("scene 2 lowers the container to the truck while the camera zooms in", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const read = () =>
    page.locator("#porteiner [data-load]").evaluate((el) => ({
      drop: new DOMMatrix(getComputedStyle(el).transform).f,
      scale: new DOMMatrix(getComputedStyle(el.parentElement!).transform).a,
    }));
  await scrollToScene(page, "porteiner", 0);
  await page.waitForTimeout(300);
  const high = await read();
  await scrollToScene(page, "porteiner", SCENE2_SCRIPT);
  await page.waitForTimeout(300);
  const low = await read();
  expect(Math.abs(high.drop)).toBeLessThan(1);
  expect(low.drop).toBeGreaterThan(1000);
  expect(low.scale).toBeGreaterThan(high.scale * 2);
  await scrollToScene(page, "porteiner", 0.55 * SCENE2_SCRIPT);
  await expect(page.getByText("O braço rodoviário da cabotagem no Brasil")).toBeVisible();
  expect(errors).toEqual([]);
});

// Scene 3 opens on scene 2's last picture: across the slide, the truck and the container do not move (the best
// match between the two is no shift at all, within a device pixel).
test("scene 3 takes over scene 2's close without a jump", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const shot = async (k: number) => {
    await page.evaluate((k) => {
      const s = document.getElementById("carga")!;
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - window.innerHeight * k, behavior: "instant" });
    }, k);
    await page.waitForTimeout(1500);
    return page.screenshot();
  };
  const [before, pinned] = [await shot(1), await shot(0)];
  const sharp = (await import("sharp")).default;
  const grey = (b: Buffer) => sharp(b).greyscale().raw().toBuffer({ resolveWithObject: true });
  const [a, c] = await Promise.all([grey(before), grey(pinned)]);
  const { width: W, height: H } = a.info;
  let best = { sad: Infinity, dx: 0, dy: 0 };
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      let sad = 0;
      for (let y = Math.floor(H * 0.35); y < Math.floor(H * 0.75); y += 2) {
        for (let x = 20; x < W - 20; x += 2) sad += Math.abs(a.data[y * W + x] - c.data[(y + dy) * W + x + dx]);
      }
      if (sad < best.sad) best = { sad, dx, dy };
    }
  }
  expect(Math.abs(best.dx)).toBeLessThanOrEqual(1);
  expect(Math.abs(best.dy)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: `e2e/__screenshots__/journey/${test.info().project.name}-scene2to3-pinned.png` });
  await shot(1);
  await page.screenshot({ path: `e2e/__screenshots__/journey/${test.info().project.name}-scene2to3-before.png` });
  await shot(0.5);
  await page.screenshot({ path: `e2e/__screenshots__/journey/${test.info().project.name}-scene2to3-mid.png` });
  expect(errors).toEqual([]);
});

// The set-down's swap from the empty truck and its container to the loaded truck: the same pixels before and after
// (the ropes and the twist-lock dots hidden, they change on purpose).
test("scene 3 swaps to the loaded truck without a pixel jump", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  await page.addStyleTag({ content: "#carga i, #carga [data-cota] { visibility: hidden !important }" });
  const truck = page.locator("#carga [aria-hidden=true]").first();
  const shot = async (p: number) => {
    await scrollToScene(page, "carga", p);
    // the scroll settles and the images finish their raster
    await page.waitForTimeout(1500);
    return page.screenshot({ clip: (await truck.boundingBox())! });
  };
  // seated (the set-down ends at 0.6 of its script, 0.327 of its scroll), not yet swapped (from 0.338); then swapped
  // c 0.36 (seated, not yet swapped) and 0.415 (swapped, the spreader not yet lifting): p = c × 120/220
  const [before, after] = [await shot((0.36 * 120) / 220), await shot((0.415 * 120) / 220)];
  const sharp = (await import("sharp")).default;
  const [a, b] = await Promise.all([before, after].map((s) => sharp(s).raw().toBuffer({ resolveWithObject: true })));
  expect(b.info.width).toBe(a.info.width);
  let off = 0;
  for (let i = 0; i < a.data.length; i += a.info.channels) {
    const d = Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c])));
    if (d > 8) off++;
  }
  expect(off).toBe(0);
  expect(errors).toEqual([]);
});

// Art-direction review: five points of scenes 2 and 3, saved for a human to look at (not diffed).
test.describe("scenes 2 to 5 frames", () => {
  for (const id of ["porteiner", "carga", "estrada", "terminal"]) {
    // (scene 2 also at 0.4 and 0.6, round the middle of its pull-back)
    for (const p of id === "porteiner" ? [0, 0.25, 0.4, 0.5, 0.6, 0.75, 1] : [0, 0.25, 0.5, 0.75, 1]) {
      test(`${id} at ${p}`, async ({ page }, testInfo) => {
        const errors = collectErrors(page);
        await page.goto("/");
        await settle(page);
        await scrollToScene(page, id, p);
        await page.waitForTimeout(1000);
        await headerSettled(page);
        await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-${id}-${p}.png` });
        expect(errors).toEqual([]);
      });
    }
  }
});

// Scene 4 slides in over scene 3's last screen: the truck must not move by a pixel, neither while it slides nor once
// it is pinned (compared in the truck's band, below the copy and above the road, which come in on purpose).
test("scene 4 takes over scene 3's truck without a pixel jump", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  // k: how far scene 4's top is above the viewport's bottom, in screens (1 = not in yet, 0 = pinned)
  const shot = async (k: number) => {
    await page.evaluate((k) => {
      const s = document.getElementById("estrada")!;
      window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - window.innerHeight * k, behavior: "instant" });
    }, k);
    await page.waitForTimeout(1500);
    return page.screenshot();
  };
  const shots = [await shot(1), await shot(0.5), await shot(0)];
  const band = await page.evaluate(() => {
    const truck = document.querySelector("#estrada [data-rim]")!.parentElement!.parentElement!.getBoundingClientRect();
    const copy = document.querySelector("#estrada .site-container")!.getBoundingClientRect();
    return { y0: Math.max(truck.top, copy.bottom + 2), y1: truck.top + (truck.height * 690) / 941, dpr: devicePixelRatio };
  });
  const sharp = (await import("sharp")).default;
  const [a, ...rest] = await Promise.all(shots.map((s) => sharp(s).raw().toBuffer({ resolveWithObject: true })));
  for (const b of rest) {
    let off = 0;
    for (let y = Math.ceil(band.y0 * band.dpr); y < Math.floor(band.y1 * band.dpr); y++) {
      for (let x = 0; x < a.info.width; x++) {
        const i = (y * a.info.width + x) * a.info.channels;
        // (16 levels: below what an eye can tell, above the odd antialiasing wobble of a busy test machine)
        if (Math.max(...[0, 1, 2].map((c) => Math.abs(a.data[i + c] - b.data[i + c]))) > 16) off++;
      }
    }
    expect(off).toBe(0);
  }
  expect(errors).toEqual([]);
});

test("scene 5's truck drives from the gate to its dock, the red line behind it", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const truck = page.locator("#terminal [class*='aspect-[941/1672]']");
  const centre = async (p: number) => {
    await scrollToScene(page, "terminal", p);
    await page.waitForTimeout(400);
    const r = (await truck.boundingBox())!;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  };
  const start = await centre(0.05);
  const end = await centre(0.95);
  // across the plan, from the gate to the dock (on phones the plan is turned: measured as a distance)
  expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeGreaterThan(100);
  const dash = await page.locator("#terminal path.stroke-red-500").evaluate((el) => Number(getComputedStyle(el).strokeDashoffset.replace("px", "")));
  expect(dash).toBeLessThan(0.01);
  expect(errors).toEqual([]);
});

// The crane never leaves the frame: at ten points of scene 2 its light layer (always under the sharp one) is in and
// shown.
test("scene 2 always shows the crane", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const crane = page.locator("#porteiner img[data-crane]");
  // ten points of the script, up to where the set leaves the close to the truck (c 0.9: scene 3 takes over)
  for (let i = 0; i < 10; i++) {
    await scrollToScene(page, "porteiner", ((0.88 * i) / 9) * SCENE2_SCRIPT);
    await expect
      .poll(() => crane.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && getComputedStyle(img).opacity === "1"), {
        message: `p = ${(i / 9).toFixed(2)}`,
      })
      .toBe(true);
    // in the frame: some of it on screen
    const box = (await crane.boundingBox())!;
    const { width, height } = page.viewportSize()!;
    expect(box.x < width && box.x + box.width > 0 && box.y < height && box.y + box.height > 0).toBe(true);
  }
  expect(errors).toEqual([]);
});

// The hero's exit into scene 1, at three points of its scroll (d: 0–1 over its first 120vh), saved for a human to
// look at: the copy and the map rising away, the photo pushing in on the deck, scene 1's picture coming over it.
test.describe("hero to scene 1 frames", () => {
  for (const d of [0.3, 0.65, 0.95]) {
    test(`hero exit at ${d}`, async ({ page }, testInfo) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await settle(page);
      await page.evaluate((d) => {
        const hero = document.getElementById("hero")!;
        window.scrollTo({ top: d * (hero.offsetHeight - 2 * window.innerHeight), behavior: "instant" });
      }, d);
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-hero-exit-${d}.png` });
      expect(errors).toEqual([]);
    });
  }
});
