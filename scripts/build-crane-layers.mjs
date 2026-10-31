// Layers for scenes 2 and 3 (spec §3), cut with sharp from the journey images; their coordinates are in
// src/components/journey/craneAnchors.ts. Writes into public/images/journey/ (the cutouts, which win over the AI
// originals in `npm run images`):
// - porteiner-base: the gantry crane without its spreader and the cables below the trolley (made transparent);
// - porteiner-spreader: the spreader alone, in its own box (SPREADER_BOX), its AI pseudo-lettering painted over;
// - container-apg-lado: the container cut from the loaded truck, its white background transparent;
// - carreta-lado: the loaded truck (the AI original, with the logo on the cab);
// - carreta-lado-vazia: the empty truck moved 1 px right, so it matches the loaded one pixel for pixel.
// The crane comes from assets-src/ai/porteiner-lado.webp (4488×5608) cut out first:
//   node scripts/cutout-white.mjs assets-src/ai/porteiner-lado.webp public/images/journey/porteiner-lado.webp 244 --global
// Run with `node scripts/build-crane-layers.mjs`, then `npm run images`.
import sharp from "sharp";

const OUT = "public/images/journey";
const CRANE = `${OUT}/porteiner-lado.webp`;
const LOADED = "assets-src/ai/carreta-lado.webp";
const EMPTY = "assets-src/ai/carreta-lado-vazia.webp";
const WEBP = { quality: 92, alphaQuality: 100 };

// Keep in step with craneAnchors.ts.
const SPREADER_BOX = { left: 1936, top: 2680, width: 776, height: 336 };
// Cables and spreader: everything from the trolley's underside down, between the boom's end of it and the leg.
const ERASE = { x0: 1920, x1: 2712, y0: 2124, y1: 3024 };
// ...but the head block under the trolley's centre, which reaches a little lower.
const HEAD_BLOCK = { x0: 2248, x1: 2404, y1: 2184 };
// Lettering the AI made up on the spreader (crane px): each row filled from its left neighbour to its right one.
const FAKE_TEXT = [
  { x0: 2360, x1: 2430, y0: 2868, y1: 2896 },
  { x0: 2552, x1: 2650, y0: 2866, y1: 2896 },
  { x0: 2176, x1: 2262, y0: 2752, y1: 2775 },
  { x0: 2384, x1: 2460, y0: 2752, y1: 2775 },
  // the face of the control box in the middle
  { x0: 2300, x1: 2346, y0: 2814, y1: 2878 },
];
const CONTAINER = { left: 370, top: 265, width: 1266, height: 293 };

// The crane without spreader and cables.
{
  const { data, info } = await sharp(CRANE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = ERASE.y0; y < ERASE.y1; y++) {
    for (let x = ERASE.x0; x < ERASE.x1; x++) {
      if (x >= HEAD_BLOCK.x0 && x < HEAD_BLOCK.x1 && y < HEAD_BLOCK.y1) continue;
      data[(y * info.width + x) * 4 + 3] = 0;
    }
  }
  await sharp(data, { raw: info }).webp(WEBP).toFile(`${OUT}/porteiner-base.webp`);
}

// The spreader alone (the stubs of the cables above its sheaves cut at the box's top), its fake lettering painted
// over with the paint beside it.
{
  const { data, info } = await sharp(CRANE).ensureAlpha().extract(SPREADER_BOX).raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => ((y - SPREADER_BOX.top) * info.width + (x - SPREADER_BOX.left)) * 4;
  for (const r of FAKE_TEXT) {
    for (let y = r.y0; y < r.y1; y++) {
      const [a, b] = [at(r.x0 - 1, y), at(r.x1, y)];
      for (let x = r.x0; x < r.x1; x++) {
        const t = (x - r.x0 + 1) / (r.x1 - r.x0 + 1);
        for (let c = 0; c < 4; c++) data[at(x, y) + c] = Math.round(data[a + c] * (1 - t) + data[b + c] * t);
      }
    }
  }
  await sharp(data, { raw: info }).webp(WEBP).toFile(`${OUT}/porteiner-spreader.webp`);
}

// The container, from the loaded truck itself: the same pixels as the truck it swaps to.
{
  const { data, info } = await sharp(LOADED).extract(CONTAINER).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < info.width * info.height; i++) {
    const [r, g, b] = [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
    if (Math.min(r, g, b) > 238) data[i * 4 + 3] = 0;
  }
  await sharp(data, { raw: info }).webp(WEBP).toFile(`${OUT}/container-apg-lado.webp`);
}

// The two trucks: the loaded one as is, the empty one 1 px to the right (measured: it sits 1 px left of the loaded
// one all along, cab, chassis and wheels).
await sharp(LOADED).webp(WEBP).toFile(`${OUT}/carreta-lado.webp`);
{
  const { width, height } = await sharp(EMPTY).metadata();
  const shifted = await sharp(EMPTY).extend({ left: 1, background: "#ffffff" }).png().toBuffer();
  await sharp(shifted).extract({ left: 0, top: 0, width, height }).webp(WEBP).toFile(`${OUT}/carreta-lado-vazia.webp`);
}

console.log("crane layers, container and trucks written to", OUT);
