// The four views of the loaded truck for scene 4, "Estrada" (spec §3, revision 2026-10-31b), cut from their white
// studio background into public/images/journey/ (the cutouts win over the AI originals in `npm run images`):
// carreta-lado and carreta-lado-vazia (side), carreta-alto-30 and carreta-alto-60 (from above, at 30° and 60°) and
// carreta-cima (straight from above, turned to point left like the others), all 1672×941 or their own size.
// The background is flood-filled from the border; what it reaches turns into black at the alpha that reproduces it
// on white (so a baked shadow stays a soft shadow on the navy road), except over the white and silver parts (the
// cab, the side guard): there only near-pure white is cleared. The side views lose their baked contact shadow: the
// scenes draw one instead.
// Run with `node scripts/build-truck-views.mjs` (after build-crane-layers.mjs), then `npm run images`.
import { writeFileSync } from "node:fs";
import sharp from "sharp";

sharp.cache(false);

const OUT = "public/images/journey";
const WEBP = { quality: 92, alphaQuality: 100 };

// flood: the lightness the background flood passes through (lower takes more of the baked shadow); keep: the
// white and silver parts' boxes (source px), where only near-pure white is background; erase: the rows of the baked
// contact shadow (all but the tyres in them) and the first row under the tyres.
const VIEWS = [
  {
    name: "carreta-lado",
    src: `${OUT}/carreta-lado.webp`,
    flood: 170,
    keep: [
      { x0: 0, x1: 330, y0: 0, y1: 680 },
      { x0: 740, x1: 1150, y0: 590, y1: 650 },
    ],
    erase: [684, 704],
  },
  {
    name: "carreta-lado-vazia",
    src: `${OUT}/carreta-lado-vazia.webp`,
    flood: 170,
    keep: [
      { x0: 0, x1: 330, y0: 0, y1: 680 },
      { x0: 740, x1: 1150, y0: 590, y1: 650 },
    ],
    erase: [684, 704],
  },
  {
    name: "carreta-alto-30",
    src: "assets-src/ai/carreta-alto-30.png",
    flood: 110,
    keep: [{ x0: 75, x1: 365, y0: 160, y1: 505 }],
  },
  {
    name: "carreta-alto-60",
    src: "assets-src/ai/carreta-alto-60.png",
    flood: 110,
    keep: [{ x0: 75, x1: 400, y0: 195, y1: 480 }],
  },
  {
    name: "carreta-cima",
    src: "assets-src/ai/carreta-cima.webp",
    flood: 110,
    keep: [
      { x0: 305, x1: 670, y0: 100, y1: 190 },
      { x0: 340, x1: 640, y0: 40, y1: 300 },
      { x0: 350, x1: 630, y0: 300, y1: 400 },
    ],
    rotate: -90,
  },
];
const KEEP_FLOOD = 244;

for (const v of VIEWS) {
  const { data, info } = await sharp(v.src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const light = (i) => {
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    const x = i % W;
    const y = (i - x) / W;
    const kept = v.keep?.some(
      (c) => x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1,
    );
    return (
      Math.min(r, g, b) > (kept ? KEEP_FLOOD : v.flood) &&
      Math.max(r, g, b) - Math.min(r, g, b) < 24
    );
  };
  const bg = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  // The contact shadow's rows (all but the dark tyres) are background, and so are the floor's pockets they close in
  // between the wheels and under the chassis.
  const shadow = new Uint8Array(W * H);
  if (v.erase) {
    for (let i = v.erase[0] * W; i < v.erase[1] * W; i++) {
      if ((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3 <= 80) continue;
      shadow[i] = bg[i] = 1;
      stack.push(i - W);
    }
  }
  while (stack.length) {
    const i = stack.pop();
    if (bg[i] || !light(i)) continue;
    bg[i] = 1;
    const x = i % W;
    if (x > 0) stack.push(i - 1);
    if (x < W - 1) stack.push(i + 1);
    if (i >= W) stack.push(i - W);
    if (i < W * (H - 1)) stack.push(i + W);
  }
  for (let i = 0; i < W * H; i++) {
    if (shadow[i] || (v.erase && i >= v.erase[1] * W)) {
      data[i * 4 + 3] = 0;
      continue;
    }
    if (!bg[i]) continue;
    // black at the alpha that shows this lightness on white; the paper's own 248+ clears to nothing
    const l = (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = 0;
    data[i * 4 + 3] = Math.round(
      Math.max(0, Math.min(1, (248 - l) / 248)) * 255,
    );
  }
  let img = sharp(data, { raw: info });
  if (v.rotate)
    img = sharp(await img.rotate(v.rotate).raw().toBuffer(), {
      raw: { width: H, height: W, channels: 4 },
    });
  // In memory first: the side views are read from the same path they are written to.
  const out = await img.webp(WEBP).toBuffer();
  writeFileSync(`${OUT}/${v.name}.webp`, out);
  console.log(v.name, v.rotate ? `${H}×${W}` : `${W}×${H}`);
}

// The fits (src/content/truckViews.json), measured on the cut-outs, for the views to swap in place
// (estradaScript's viewFit): the rig's front (the cab's nose) and rear, and the rear wheel's contact point (the
// near side's last tyre, its lowest row). Seen straight from above no tyre shows: its contact point sits as far
// from the rear as the side view's, on the footprint's near edge.
const solidAt = (data, W) => (x, y) => {
  const i = (y * W + x) * 4;
  return data[i + 3] > 200 && Math.max(data[i], data[i + 1], data[i + 2]) > 6;
};
const fits = {};
for (const name of ["carreta-lado", "carreta-alto-30", "carreta-alto-60", "carreta-cima"]) {
  const { data, info } = await sharp(`${OUT}/${name}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const solid = solidAt(data, W);
  let [x0, x1, y0, y1] = [W, 0, H, 0];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!solid(x, y)) continue;
      [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
    }
  }
  const fit = { width: W, height: H, front: x0, rear: x1, top: y0, bottom: y1 };
  if (name === "carreta-cima") {
    const side = fits["carreta-lado"];
    const back = (side.rear - side.wheel.x) / (side.rear - side.front);
    fits[name] = { ...fit, wheel: { x: Math.round(x1 - back * (x1 - x0)), y: y1 } };
    continue;
  }
  // the tyres: in the rig's rear fifth, the columns darkest over the bottom 2.2% of the image (below the rims) (a tyre is dark all the
  // way down; between two, only the contact shadow is), grouped; the last group is the rear wheel
  const band = Math.round(0.022 * H);
  const dark = [];
  for (let x = Math.ceil(x1 - 0.2 * (x1 - x0)); x <= x1; x++) {
    let n = 0;
    for (let yy = y1 - band; yy <= y1; yy++) {
      const i = (yy * W + x) * 4;
      if (solid(x, yy) && Math.max(data[i], data[i + 1], data[i + 2]) < 70) n++;
    }
    dark.push([x, n]);
  }
  const most = Math.max(...dark.map(([, n]) => n));
  const groups = [];
  for (const [x, n] of dark) {
    if (n < 0.7 * most) continue;
    const last = groups[groups.length - 1];
    if (last && x - last[1] < 8) last[1] = x;
    else groups.push([x, x]);
  }
  // (a mudflap is dark too, but narrow: the rear wheel is the last group at least half as wide as the widest)
  const widest = Math.max(...groups.map(([g0, g1]) => g1 - g0));
  const [a, b] = groups.filter(([g0, g1]) => g1 - g0 >= widest / 2).at(-1);
  fits[name] = { ...fit, wheel: { x: Math.round((a + b) / 2), y: y1 } };
}
writeFileSync("src/content/truckViews.json", JSON.stringify(fits, null, 2) + "\n");
console.log(fits);
