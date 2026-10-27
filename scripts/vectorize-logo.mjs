// Vectorizes assets-src/logo/logo-original.png into public/brand/*.svg and src/app/icon.svg,
// then checks the rendered logo.svg against the PNG pixel by pixel.
// Usage: node scripts/vectorize-logo.mjs
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import potrace from "potrace";
import sharp from "sharp";

const SRC = "assets-src/logo/logo-original.png";
const BLUE = "#393185";
const RED = "#E31E24";
const NAVY = "#0A1338";
const TOLERANCE = 24;
const MAX_DIFF = 0.015;
const POTRACE = { turdSize: 4, optTolerance: 0.2, threshold: 128, blackOnWhite: true };

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

function mask(hex) {
  const rgb = hexToRgb(hex);
  const out = Buffer.alloc(width * height, 255);
  const box = { x0: width, y0: height, x1: -1, y1: -1 };
  for (let p = 0; p < width * height; p++) {
    const i = p * 4;
    if (data[i + 3] < 128) continue;
    if (rgb.every((c, k) => Math.abs(data[i + k] - c) <= TOLERANCE)) {
      out[p] = 0;
      const x = p % width, y = (p / width) | 0;
      box.x0 = Math.min(box.x0, x); box.y0 = Math.min(box.y0, y);
      box.x1 = Math.max(box.x1, x); box.y1 = Math.max(box.y1, y);
    }
  }
  return { out, box };
}

async function trace(maskBuf, fill) {
  const png = await sharp(maskBuf, { raw: { width, height, channels: 1 } }).png().toBuffer();
  const tracer = new potrace.Potrace(POTRACE);
  await new Promise((resolve, reject) => tracer.loadImage(png, (err) => (err ? reject(err) : resolve())));
  return tracer.getPathTag(fill);
}

const viewBox = ({ x0, y0, x1, y1 }) => [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
const union = (a, b) => ({
  x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0),
  x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1),
});
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}">${body}</svg>\n`;

const blue = mask(BLUE);
const red = mask(RED);
const bluePath = await trace(blue.out, BLUE);
const redPath = await trace(red.out, RED);
const logoBox = viewBox(union(blue.box, red.box));
const arrowBox = viewBox(red.box);

writeFileSync("public/brand/logo.svg", svg(logoBox, bluePath + redPath));
writeFileSync(
  "public/brand/logo-white.svg",
  svg(logoBox, bluePath.replace(BLUE, "#FFFFFF") + redPath.replace(RED, "#FFFFFF")),
);
writeFileSync("public/brand/arrow.svg", svg(arrowBox, redPath));

// favicon: the red arrow centred on a navy tile, 82% of the tile width
const [ax, ay, aw, ah] = arrowBox;
const scale = (64 * 0.82) / Math.max(aw, ah);
writeFileSync(
  "src/app/icon.svg",
  svg(
    [0, 0, 64, 64],
    `<rect width="64" height="64" rx="12" fill="${NAVY}"/>` +
      `<g transform="translate(32 32) scale(${scale}) translate(${-(ax + aw / 2)} ${-(ay + ah / 2)})">${redPath}</g>`,
  ),
);

execSync(
  "npx --yes svgo --multipass -q public/brand/logo.svg public/brand/logo-white.svg public/brand/arrow.svg src/app/icon.svg",
  { stdio: "inherit" },
);

// --- check: render the optimized logo.svg at the PNG's size and compare classes per pixel
const [lx, ly, lw, lh] = logoBox;
const logoSvg = readFileSync("public/brand/logo.svg", "utf8").replace("<svg ", `<svg width="${lw}" height="${lh}" `);
const rendered = await sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  .composite([{ input: Buffer.from(logoSvg), left: lx, top: ly }])
  .raw()
  .toBuffer();

const [b, r] = [hexToRgb(BLUE), hexToRgb(RED)];
const dist = (buf, i, c) => (buf[i] - c[0]) ** 2 + (buf[i + 1] - c[1]) ** 2 + (buf[i + 2] - c[2]) ** 2;
const classOf = (buf, i) => (buf[i + 3] < 128 ? 0 : dist(buf, i, b) <= dist(buf, i, r) ? 1 : 2);

let opaque = 0, diff = 0;
for (let i = 0; i < data.length; i += 4) {
  const want = classOf(data, i);
  if (want) opaque++;
  if (want !== classOf(rendered, i)) diff++;
}
const ratio = diff / opaque;
console.log(`diff: ${(ratio * 100).toFixed(3)}% (${diff} of ${opaque} opaque pixels)`);
if (ratio > MAX_DIFF) {
  console.error(`FAIL: above ${MAX_DIFF * 100}%`);
  process.exit(1);
}
