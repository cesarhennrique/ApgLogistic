// Layers for scenes 2 and 3 (spec §3), cut with sharp from the journey images; their coordinates are in
// src/components/journey/craneAnchors.ts. Writes into public/images/journey/ (the cutouts, which win over the AI
// originals in `npm run images`):
// - porteiner-base: the gantry crane without its spreader and the cables below the trolley (made transparent);
// - porteiner-spreader: the spreader alone, in its own box (SPREADER_BOX);
// - container-apg-lado: the container cut from the loaded truck, its white background transparent;
// - carreta-lado: the loaded truck (the AI original, with the logo on the cab);
// - carreta-lado-vazia: the empty truck moved 1 px right, so it matches the loaded one pixel for pixel.
// Run with `node scripts/build-crane-layers.mjs`, then `npm run images`.
import sharp from "sharp";

const OUT = "public/images/journey";
const CRANE = `${OUT}/porteiner-lado.webp`;
const LOADED = "assets-src/ai/carreta-lado.webp";
const EMPTY = "assets-src/ai/carreta-lado-vazia.webp";
const WEBP = { quality: 92, alphaQuality: 100 };

// Keep in step with craneAnchors.ts.
const SPREADER_BOX = { left: 484, top: 670, width: 194, height: 84 };
// Cables and spreader: everything from the trolley's underside down, between the boom's end of it and the leg.
const ERASE = { x0: 480, x1: 678, y0: 531, y1: 756 };
// ...but the head block under the trolley's centre, which reaches a little lower.
const HEAD_BLOCK = { x0: 562, x1: 601, y1: 546 };
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

// The spreader alone (the stubs of the cables above its sheaves cut at the box's top).
await sharp(CRANE).ensureAlpha().extract(SPREADER_BOX).webp(WEBP).toFile(`${OUT}/porteiner-spreader.webp`);

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
