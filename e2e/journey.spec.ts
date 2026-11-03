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

// The scroll at which a scene's own progress (the desktop one its script runs on, 0–1) is p, on any screen: from
// the scene's data-scroll (Scene: its range in vh, from, and on phones the head and tail kept a screen each while
// the rest is scaled). A sliding scene's progress starts with its top at the viewport's bottom.
async function sceneY(page: Page, id: string, p: number) {
  return page.evaluate(
    ([id, p]) => {
      const s = document.getElementById(id)!;
      const [range, from, head, tail, scale] = s.dataset.scroll!.split(" ").map((v, i) => (i === 1 ? v : Number(v))) as [
        number,
        string,
        number,
        number,
        number,
      ];
      const mid = range - head - tail;
      const vh = p * range;
      const at = innerWidth >= 768 || scale === 1 ? vh : vh < head ? vh : vh < head + mid ? head + (vh - head) * scale : vh - (1 - scale) * mid;
      const top = s.getBoundingClientRect().top + window.scrollY - (from === "slide" ? innerHeight : 0);
      return top + (at / 100) * innerHeight;
    },
    [id, p] as const,
  );
}
async function scrollToProgress(page: Page, id: string, p: number) {
  const y = await sceneY(page, id, p);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
}

// Scene 1's progress (0–1): from the moment it starts sliding in over the hero (its top at the viewport's bottom)
// to its end. The camera moves from 0.
const scrollToArrival = (page: Page, q: number) => scrollToProgress(page, "chegada", q);

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
  // 10vh of the scene's own (desktop) range: on phones, 7.5vh of scroll in its scaled stretch
  const step = await page.evaluate(() => 10 / Number(document.getElementById("chegada")!.dataset.scroll!.split(" ")[0]));
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

test("the hero's map is the only canvas until scene 5 comes near; then scene 5's mounts", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await expect(page.locator("#hero canvas")).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await scrollToEstrada(page, 0.6);
  await page.waitForTimeout(500);
  await expect(page.locator("#distribuicao canvas")).toHaveCount(0);
  await scrollToProgress(page, "distribuicao", 0.4);
  await expect(page.locator("#distribuicao canvas")).toHaveCount(1);
});

// The side index (wide screens): a mark per scene, the one in view current; a click takes you to its scene. Not on
// phones.
test("the side index marks the scene in view and takes you to another", async ({ page }, testInfo) => {
  await page.goto("/");
  await settle(page);
  const index = page.getByRole("navigation", { name: "Cenas da jornada" });
  if (testInfo.project.name === "mobile") {
    await expect(index).toBeHidden();
    return;
  }
  await expect(index.getByRole("button")).toHaveCount(6);
  await expect(index.getByRole("button", { name: "Ir para Quem somos" })).toHaveAttribute("aria-current", "step");
  await index.getByRole("button", { name: "Ir para Estrada" }).click();
  await expect
    .poll(() => page.evaluate(() => document.getElementById("estrada")!.getBoundingClientRect().top), { timeout: 8000 })
    .toBeLessThan(2);
  await expect(index.getByRole("button", { name: "Ir para Estrada" })).toHaveAttribute("aria-current", "step");
});

// Reduced motion: no scrub; each scene a screen, its end state still, with its text.
test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("each scene stands still a screen high, with its text", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("load");
    const vh = await page.evaluate(() => innerHeight);
    for (const id of ["chegada", "porteiner", "carga", "distribuicao"]) {
      const box = (await page.locator(`#${id}`).boundingBox())!;
      expect(Math.abs(box.height - vh), id).toBeLessThan(2);
    }
    await expect(page.getByText("O braço rodoviário da cabotagem no Brasil")).toBeAttached();
    await expect(page.locator("#estrada").getByText("Do porto ao destino final.")).toBeVisible();
    await page.locator("#distribuicao").scrollIntoViewIfNeeded();
    await expect(page.locator("#distribuicao").getByText("entregas fracionadas por dia")).toBeVisible();
    await expect(page.locator("#distribuicao").getByText("500", { exact: true })).toBeVisible();
  });
});

test("the Home's container codes run 01, 02, 03… in order, without repeats", async ({ page }) => {
  await page.goto("/");
  const codes = await page
    .locator("main")
    // (the sections' codes: not the container code on scene 1's card, a note on the photo, nor scene 4's chapters,
    // which carry the scene's own code with their number, 01/05…)
    .evaluate((main) => {
      const copy = main.cloneNode(true) as HTMLElement;
      for (const note of copy.querySelectorAll("[data-note], [data-chapter]")) note.remove();
      return [...copy.textContent!.matchAll(/APGU 1996-(\d{2})/g)].map((m) => Number(m[1]));
    });
  expect(codes.length).toBeGreaterThanOrEqual(9);
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

// Scenes 2 and 3 (spec §3): the share p of a scene's pinned scroll (desktop vh), from its top at the viewport's top
// to its end; for a sliding scene, after its slide.
async function scrollToScene(page: Page, id: string, p: number) {
  const [range, from] = await page.evaluate((id) => document.getElementById(id)!.dataset.scroll!.split(" "), id);
  const r = Number(range);
  await scrollToProgress(page, id, from === "slide" ? (100 + p * (r - 100)) / r : p);
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

// Scene 3 opens on scene 2's last picture: as it pins, scene 2's frame at that same scroll (scene 3 hidden) and
// scene 3's own match, the best shift between them none at all, within a device pixel.
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
  const hide = await page.addStyleTag({ content: "#carga { visibility: hidden !important }" });
  const before = await shot(0);
  await hide.evaluate((el) => (el as Element).remove());
  const pinned = await shot(0);
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
  // five points across the hand-over, for a human to look at: scene 3 a screen away, half in, pinned, 4vh and 8vh on
  for (const k of [1, 0.5, 0, -0.04, -0.08]) {
    await shot(k);
    await page.screenshot({ path: `e2e/__screenshots__/journey/${test.info().project.name}-scene2to3-${k}.png` });
  }
  expect(errors).toEqual([]);
});

// No dead scroll at the hand-over: from the end of scene 2's script to the set-down early in scene 3, every 5vh the
// container is lower (its dimension in metres, scene 2's then scene 3's, goes down), to 0.
test("the container keeps coming down from scene 2 to its seat in scene 3", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  // to scene 3's set-down: 0.06 of its 120vh script after it pins (its slide, 100vh of 320)
  const [from, to] = [await sceneY(page, "porteiner", SCENE2_SCRIPT), await sceneY(page, "carga", (100 + 0.06 * 120) / 320)];
  const vh = await page.evaluate(() => innerHeight);
  const heights: number[] = [];
  for (let y = from; y <= to + 1; y += 0.05 * vh) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
    await page.waitForTimeout(250);
    heights.push(
      await page.evaluate(() => {
        const pinned = document.getElementById("carga")!.getBoundingClientRect().top <= 0.5;
        const label = document.querySelector(pinned ? "#carga [data-cota] span" : "#porteiner [data-drop-cota] span")!;
        return Number(label.textContent!.replace(" m", "").replace(",", "."));
      }),
    );
  }
  for (let i = 1; i < heights.length; i++) expect(heights[i], `step ${i}: ${heights.join(" ")}`).toBeLessThan(heights[i - 1]);
  expect(heights[heights.length - 1]).toBe(0);
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
  // c 0.075 (seated, not yet swapped) and 0.125 (swapped, the spreader not yet lifting): p = c × 120/220
  const [before, after] = [await shot((0.075 * 120) / 220), await shot((0.125 * 120) / 220)];
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

// Art-direction review: points of scenes 2, 3 and 5, saved for a human to look at (not diffed).
test.describe("scenes 2, 3 and 5 frames", () => {
  for (const id of ["porteiner", "carga", "distribuicao"]) {
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
  // (the side index changes its mark across the slide, on purpose)
  await page.addStyleTag({ content: "#journey > nav { visibility: hidden !important }" });
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

// Scene 4's progress (0–1), from the moment it starts sliding in over scene 3 to its end.
const scrollToEstrada = (page: Page, p: number) => scrollToProgress(page, "estrada", p);
// Its phases in desktop vh (estradaScript): slide 100, A 300, B 150, C 500, D 120, E 100.
const ESTRADA = 1270;

// Scene 4's B, the camera rising: the truck alone on a white page (everything else hidden), its pixels' box at 40
// steps of the phase. It only shrinks, smoothly (no step's shrink more than 1.5% of its width, +4 px, off its
// neighbours' average: a step in the curve), and its centre holds (never 12 px in a step): no jump of size or place
// at the views' crossfades.
test("scene 4's camera rises without a jump in the truck's size or place", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const [b0, b1] = [400 / ESTRADA, 550 / ESTRADA];
  await scrollToEstrada(page, b0 + 0.01);
  await page.waitForTimeout(2500);
  await page.addStyleTag({
    content: "#estrada > div > div > *:not([class*='aspect-[1672/941]']), header, nextjs-portal, #journey > nav { visibility: hidden !important }",
  });
  const sharp = (await import("sharp")).default;
  const boxes: { w: number; cx: number; cy: number }[] = [];
  for (let i = 0; i <= 40; i++) {
    await scrollToEstrada(page, b0 + ((b1 - b0) * i) / 40);
    await page.waitForTimeout(250);
    const { data, info } = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
    let [x0, x1, y0, y1] = [Infinity, -1, Infinity, -1];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const j = (y * info.width + x) * info.channels;
        if (Math.min(data[j], data[j + 1], data[j + 2]) >= 150) continue;
        [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
      }
    }
    boxes.push({ w: x1 - x0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 });
  }
  expect(boxes[40].w).toBeLessThan(boxes[0].w / 2);
  for (let i = 1; i < boxes.length; i++) {
    const [a, b] = [boxes[i - 1], boxes[i]];
    expect(b.w - a.w, `step ${i}`).toBeLessThanOrEqual(2);
    if (i < boxes.length - 1) {
      const around = (boxes[i - 1].w - boxes[i + 1].w) / 2;
      expect(Math.abs(a.w - b.w - around), `step ${i}`).toBeLessThan(0.015 * a.w + 4);
    }
    expect(Math.hypot(b.cx - a.cx, b.cy - a.cy), `step ${i}`).toBeLessThan(12);
  }
  expect(errors).toEqual([]);
});

// Scene 4 in one: the side view first, the view from above by the end of B, every chapter of the history shown as
// the truck passes it along the track, the scoreboard full at the dock.
test("scene 4 rises from the side view to the track and ends at the dock", async ({ page }) => {
  test.setTimeout(120_000);
  const errors = collectErrors(page);
  await page.goto("/");
  await settle(page);
  const views = () =>
    page.locator("#estrada [data-rim]").first().evaluate((rim) => [...rim.parentElement!.parentElement!.children].map((v) => Number((v as HTMLElement).style.opacity)));
  // halfway through A
  await scrollToEstrada(page, 250 / ESTRADA);
  await page.waitForTimeout(500);
  expect(await views()).toEqual([1, 0, 0, 0]);
  // C's start: from above alone
  await scrollToEstrada(page, 560 / ESTRADA);
  await page.waitForTimeout(500);
  expect(await views()).toEqual([0, 0, 0, 1]);
  // C: every chapter in, at some point
  const shown = new Array(5).fill(0);
  for (let i = 0; i <= 50; i++) {
    await scrollToEstrada(page, (550 + (500 * i) / 50) / ESTRADA);
    await page.waitForTimeout(120);
    const o = await page.locator("#estrada [data-chapter]").evaluateAll((els) => els.map((e) => Number((e as HTMLElement).style.opacity)));
    o.forEach((v, j) => (shown[j] = Math.max(shown[j], v)));
  }
  expect(shown.every((v) => v > 0.95)).toBe(true);
  // D's end: the scoreboard, counted up
  await scrollToEstrada(page, 1170 / ESTRADA);
  await page.waitForTimeout(800);
  await expect(page.locator("#estrada [data-value]")).toHaveText(["35.000", "4.000", "46", "5.000"]);
  expect(errors).toEqual([]);
});

// Art-direction review: scene 4 at every tenth of its progress, saved for a human to look at (not diffed).
test.describe("scene 4 frames", () => {
  for (let i = 0; i <= 10; i++) {
    const p = i / 10;
    test(`estrada at ${p}`, async ({ page }, testInfo) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await settle(page);
      await scrollToEstrada(page, p);
      await page.waitForTimeout(1200);
      await headerSettled(page);
      await page.screenshot({ path: `e2e/__screenshots__/journey/${testInfo.project.name}-estrada-${p}.png` });
      expect(errors).toEqual([]);
    });
  }
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
