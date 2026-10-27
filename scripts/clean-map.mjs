// Cleans assets-src/map/nordeste-ibge.svg into public/images/map/nordeste.svg:
// one <path id="UF"> per state, no fill/stroke, the IBGE scale(0.0001,-0.0001) baked into the
// coordinates, tight viewBox.
// Projection (must match project() in src/components/home/CoverageMap.tsx):
//   x = (lon + 49) * 100, y = (2 - lat) * 100   (equirectangular, 1 unit = 0.01°)
// Usage: node scripts/clean-map.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const SRC = "assets-src/map/nordeste-ibge.svg";
const OUT = "public/images/map/nordeste.svg";
const UF = { 21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA" };

const src = readFileSync(SRC, "utf8");
if (!src.includes('transform="scale(0.0001,-0.0001)"')) throw new Error("unexpected IBGE transform");

const toX = (ix) => (ix * 1e-4 + 49) * 100;
const toY = (iy) => (2 - iy * 1e-4) * 100; // IBGE stores lat * 1e4; the scale(…,-1) flips it for display
const r = (n) => Math.round(n * 10) / 10;

const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
const paths = [];

for (const [, code, d] of src.matchAll(/<path id="(\d+)" d="([^"]+)"/g)) {
  const id = UF[code];
  if (!id) throw new Error(`unknown state code ${code}`);
  let x = 0, y = 0, out = "";
  // The IBGE file only uses absolute M, relative l/h/v and Z.
  for (const [, cmd, args] of d.matchAll(/([MlhvZ])([^MlhvZ]*)/g)) {
    if (cmd === "Z") { out += "Z"; continue; }
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const step = cmd === "h" || cmd === "v" ? 1 : 2;
    for (let i = 0; i < nums.length; i += step) {
      if (cmd === "M" && i === 0) { x = nums[0]; y = nums[1]; }
      else if (cmd === "h") x += nums[i];
      else if (cmd === "v") y += nums[i];
      else { x += nums[i]; y += nums[i + 1]; }
      if (Number.isNaN(x + y)) throw new Error(`bad number in state ${code}`);
      const px = r(toX(x)), py = r(toY(y));
      box.x0 = Math.min(box.x0, px); box.y0 = Math.min(box.y0, py);
      box.x1 = Math.max(box.x1, px); box.y1 = Math.max(box.y1, py);
      out += `${cmd === "M" && i === 0 ? "M" : "L"}${px} ${py}`;
    }
  }
  paths.push(`<path id="${id}" d="${out}"/>`);
}
if (paths.length !== 9) throw new Error(`expected 9 states, got ${paths.length}`);

const vb = [box.x0, box.y0, r(box.x1 - box.x0), r(box.y1 - box.y0)].join(" ");
mkdirSync("public/images/map", { recursive: true });
writeFileSync(OUT, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${paths.join("")}</svg>\n`);
console.log(`${OUT}: viewBox ${vb}`);
