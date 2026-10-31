// Journey images (spec §6, "Cenas da jornada"): every source image in WebP and AVIF at 800, 1200, 1920 (when
// wider) and its own width, as public/images/journey/<name>-<width>.<ext>, plus src/content/journeyImages.json (sizes
// for <picture>).
// Sources: assets-src/ai/ (the AI originals) and public/images/journey/ (the cutouts, which win over an original
// of the same name). Run with `npm run images`.
import { readdirSync, writeFileSync } from "node:fs";
import { join, parse } from "node:path";
import sharp from "sharp";

const SOURCES = ["assets-src/ai", "public/images/journey"];
const OUT = "public/images/journey";
const WIDTHS = [800, 1200, 1920];
const GENERATED = /-\d+$/;

const sources = new Map();
for (const dir of SOURCES) {
  for (const file of readdirSync(dir)) {
    const { name, ext } = parse(file);
    if (ext !== ".webp" || GENERATED.test(name)) continue;
    sources.set(name, join(dir, file));
  }
}

const manifest = {};
for (const [name, path] of [...sources].sort()) {
  const { width, height } = await sharp(path).metadata();
  const widths = [...WIDTHS.filter((w) => w < width), width];
  for (const w of widths) {
    const base = sharp(path).resize({ width: w });
    await base.clone().webp({ quality: 82 }).toFile(join(OUT, `${name}-${w}.webp`));
    await base.clone().avif({ quality: 55, effort: 4 }).toFile(join(OUT, `${name}-${w}.avif`));
  }
  manifest[name] = { width, height, widths };
  console.log(`${name}: ${width}×${height} → ${widths.join(", ")}`);
}

// The loaded and empty trucks swap in place at the twist locks: they must share one pixel box.
const [loaded, empty] = [manifest["carreta-lado"], manifest["carreta-lado-vazia"]];
if (loaded && empty && (loaded.width !== empty.width || loaded.height !== empty.height)) {
  throw new Error(`carreta-lado (${loaded.width}×${loaded.height}) and carreta-lado-vazia (${empty.width}×${empty.height}) differ`);
}

writeFileSync("src/content/journeyImages.json", JSON.stringify(manifest, null, 2) + "\n");
