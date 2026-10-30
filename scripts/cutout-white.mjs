// Removes the pure-white studio background of an AI cut-out by flood-filling from the image border.
// Usage: node scripts/cutout-white.mjs <in> <out.webp> [threshold=236]
import sharp from "sharp";

const [, , input, output, thr = "236"] = process.argv;
const T = Number(thr);
const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;
const isBg = (i) => {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  return r > T && g > T && b > T && Math.max(r, g, b) - Math.min(r, g, b) < 12;
};
const bg = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || !isBg(i)) continue;
  bg[i] = 1;
  const x = i % W;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (i >= W) stack.push(i - W);
  if (i < W * (H - 1)) stack.push(i + W);
}
// 1px soft edge: background pixels touching the subject get half alpha.
for (let i = 0; i < W * H; i++) {
  if (!bg[i]) continue;
  const x = i % W;
  const edge = (x > 0 && !bg[i - 1]) || (x < W - 1 && !bg[i + 1]) || (i >= W && !bg[i - W]) || (i < W * (H - 1) && !bg[i + W]);
  data[i * 4 + 3] = edge ? 110 : 0;
}
await sharp(data, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(output);
console.log(output, W, H);
