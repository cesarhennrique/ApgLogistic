import { expect, type Page, test } from "@playwright/test";

// The journey's hand-overs (spec §3): hero → 1, 1 → 2, 2 → 3, 3 → 4 (Estrada), 4 → 5 (Distribution) and 5 → the
// services. Across each one, in steps of 5vh of scroll: every step changes the picture (no dead scroll) and no frame
// shows a thin line across the screen between two flat areas (a band between scenes). The pixel-exact hand-overs
// have their own tests (journey.spec.ts); here, 4 → 5's: the terminal's red point on the very same pixel.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
});

// The desktop's journey (pinned, scrubbed scenes); a phone has its own (M3: e2e/mobile-journey.spec.ts).
test.skip(({ isMobile }) => isMobile, "the desktop's journey");

// The scroll at a scene's own (desktop) progress p, on any screen (as journey.spec.ts's sceneY).
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

async function settle(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("load");
  // (the 3D map on wide screens; phones, the 'low' tier, draw it as SVG)
  await page.locator("#hero canvas:not([data-photo]), #hero [data-static-map]").first().waitFor({ state: "attached", timeout: 15_000 });
  await page.waitForTimeout(1500);
}

// A thin (1–3 px) full-width line of one colour, between flat rows of another above and below it.
function seamIn({ data, info }: { data: Buffer; info: { width: number; height: number; channels: number } }) {
  const { width: W, height: H, channels: C } = info;
  const rows = Array.from({ length: H }, (_, y) => {
    let min = 255;
    let max = 0;
    let sum = 0;
    let n = 0;
    for (let x = 0; x < W; x += 3) {
      const i = (y * W + x) * C;
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      min = Math.min(min, v);
      max = Math.max(max, v);
      sum += v;
      n++;
    }
    return { flat: max - min < 10, mean: sum / n };
  });
  for (let y = 2; y < H - 5; y++) {
    if (!rows[y].flat) continue;
    for (let h = 1; h <= 3; h++) {
      const [above, below] = [rows[y - 2], rows[y + h + 1]];
      const line = rows.slice(y, y + h).every((r) => r.flat && Math.abs(r.mean - rows[y].mean) < 6);
      if (line && above.flat && below.flat && Math.abs(above.mean - below.mean) < 6 && Math.abs(rows[y].mean - above.mean) > 60) return y;
    }
  }
  return -1;
}

const HANDOVERS: { name: string; from: (page: Page) => Promise<number>; to: (page: Page) => Promise<number> }[] = [
  { name: "hero → 1", from: (p) => sceneY(p, "chegada", 0), to: (p) => sceneY(p, "chegada", 110 / 320) },
  // (scene 1 ends, then scene 2 comes up from below and pins)
  { name: "1 → 2", from: async (p) => (await sceneY(p, "chegada", 1)) - (await p.evaluate(() => 0.3 * innerHeight)), to: (p) => sceneY(p, "porteiner", 0.05) },
  { name: "2 → 3", from: (p) => sceneY(p, "carga", 0), to: (p) => sceneY(p, "carga", 110 / 320) },
  { name: "3 → 4", from: (p) => sceneY(p, "estrada", 0), to: (p) => sceneY(p, "estrada", 110 / 1270) },
  { name: "4 → 5", from: (p) => sceneY(p, "distribuicao", 0), to: (p) => sceneY(p, "distribuicao", 110 / 460) },
  { name: "5 → services", from: (p) => sceneY(p, "distribuicao", 360 / 460), to: (p) => sceneY(p, "distribuicao", 1) },
];

for (const h of HANDOVERS) {
  test(`${h.name}: every 5vh changes the picture, never a band between the scenes`, async ({ page }) => {
    test.setTimeout(120_000);
    await settle(page);
    // (the side index and the header change on their own schedule)
    await page.addStyleTag({ content: "#journey > nav, header { visibility: hidden !important }" });
    const sharp = (await import("sharp")).default;
    const [from, to, vh] = [await h.from(page), await h.to(page), await page.evaluate(() => innerHeight)];
    let last: Buffer | null = null;
    for (let y = from; y <= to + 1; y += 0.05 * vh) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(300);
      const shot = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
      expect(seamIn(shot), `band at scroll ${Math.round(y)}`).toBe(-1);
      if (last) {
        let changed = 0;
        for (let i = 0; i < shot.data.length; i += shot.info.channels * 7) if (Math.abs(shot.data[i] - last[i]) > 6) changed++;
        expect(changed, `dead step at scroll ${Math.round(y)}`).toBeGreaterThan(4);
      }
      last = shot.data;
    }
  });
}

// 4 → 5: scene 4's last frame (navy, the terminal's red point) and scene 5's first, pinned, its point on the same
// pixel (the centre of its red, within a pixel).
test("4 → 5: the dock's red point is scene 5's terminal, on the same pixel", async ({ page }) => {
  await settle(page);
  await page.addStyleTag({ content: "#journey > nav, header { visibility: hidden !important }" });
  const sharp = (await import("sharp")).default;
  const red = async () => {
    const { data, info } = await sharp(await page.screenshot()).raw().toBuffer({ resolveWithObject: true });
    let [sx, sy, n] = [0, 0, 0];
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * info.channels;
        if (data[i] > 180 && data[i + 1] < 80 && data[i + 2] < 80) [sx, sy, n] = [sx + x, sy + y, n + 1];
      }
    }
    return { x: sx / n, y: sy / n, n };
  };
  // scene 5 a hair from pinned (scene 4's frame), then pinned
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (await sceneY(page, "distribuicao", 99.5 / 460)));
  await page.waitForTimeout(1200);
  const before = await red();
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (await sceneY(page, "distribuicao", 100 / 460)) + 1);
  await page.waitForTimeout(1200);
  const after = await red();
  expect(before.n).toBeGreaterThan(20);
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(1.5);
});
