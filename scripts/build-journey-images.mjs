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
// Images that need other widths: the hero's photo spans the widest screens.
const WIDTHS_FOR = { "hero-porto": [800, 1200, 1920, 2560, 3840] };
// AVIF quality where the default (55) is more than the eye needs: the phone's LCP, 72 KB instead of 92.
const AVIF_QUALITY_FOR = { "hero-porto-mobile": 48 };
// Crops built as images of their own: the hero's phone framing, portrait, on the bow and the cranes (source px).
const CROPS = { "hero-porto-mobile": { from: "hero-porto", left: 2690, top: 0, width: 760, height: 1645 } };
// A generated width has 3+ digits (carreta-alto-30 is a source).
const GENERATED = /-\d{3,}$/;

const sources = new Map();
for (const dir of SOURCES) {
  for (const file of readdirSync(dir)) {
    const { name, ext } = parse(file);
    if (ext !== ".webp" || GENERATED.test(name)) continue;
    sources.set(name, join(dir, file));
  }
}

const manifest = {};
const entries = [...sources].map(([name, path]) => ({ name, path, crop: null }));
for (const [name, { from, ...crop }] of Object.entries(CROPS)) entries.push({ name, path: sources.get(from), crop });
for (const { name, path, crop } of entries.sort((a, b) => a.name.localeCompare(b.name))) {
  const source = () => (crop ? sharp(path).extract(crop) : sharp(path));
  const { width, height } = crop ?? (await sharp(path).metadata());
  const widths = WIDTHS_FOR[name] ?? [...WIDTHS.filter((w) => w < width), width];
  for (const w of widths) {
    const base = source().resize({ width: w });
    await base.clone().webp({ quality: 82 }).toFile(join(OUT, `${name}-${w}.webp`));
    await base.clone().avif({ quality: AVIF_QUALITY_FOR[name] ?? 55, effort: 4 }).toFile(join(OUT, `${name}-${w}.avif`));
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
