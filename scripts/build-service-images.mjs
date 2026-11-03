// The service cards' cut-outs (spec §4), into public/images/journey/ next to the journey's (then `npm run images`):
// - servico-containers-suape: the crane's trolley and its spreader (porteiner-spreader, clean) with the APG container
//   hanging under it, as scene 2 lowers it (craneCamera's CONTAINER), cropped to the card (4:5);
// - porteiner-servico: the whole crane, the container on its spreader (scene 2's wide shot), cropped to the crane's
//   bounds (craneAnchors' CRANE_BOUNDS: its legs on the crop's bottom edge), for containers-suape's page hero;
// - armazem-docas: the warehouse and its docks, its white studio background cut out.
// operacao-bahia's card uses carreta-lado as it is. Run with `node scripts/build-service-images.mjs` (after
// build-crane-layers.mjs and scripts/cutout-white.mjs on porteiner-lado), then `npm run images`.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import sharp from "sharp";

sharp.cache(false);
const OUT = "public/images/journey";

// Keep in step with craneAnchors.ts / craneCamera.ts: the spreader's span and the container under it (crane px).
const SPREADER = { x: 1956, w: 736, bottom: 2992 };
const SPREADER_BOX = { left: 1936, top: 2680 };
const CONTAINER = { left: SPREADER.x, top: SPREADER.bottom - 16, width: SPREADER.w };
// The card's crop round them (4:5): the trolley above, the near leg at the right; the hero's, the whole crane.
const CROP = { left: 1640, top: 1900, width: 1360, height: 1700 };
const BOUNDS = { left: 64, top: 324, width: 4420 - 64, height: 5068 - 324 };

{
  const container = await sharp(`${OUT}/container-apg-lado.webp`).resize({ width: CONTAINER.width }).toBuffer();
  const crane = await sharp(`${OUT}/porteiner-lado.webp`)
    // the spreader as scene 2 draws it (its AI pseudo-lettering painted over), the container under it
    .composite([
      { input: `${OUT}/porteiner-spreader.webp`, ...SPREADER_BOX },
      { input: container, left: CONTAINER.left, top: CONTAINER.top },
    ])
    .png()
    .toBuffer();
  const out = await sharp(crane).extract(CROP).webp({ quality: 92, alphaQuality: 100 }).toBuffer();
  writeFileSync(`${OUT}/servico-containers-suape.webp`, out);
  writeFileSync(`${OUT}/porteiner-servico.webp`, await sharp(crane).extract(BOUNDS).webp({ quality: 92, alphaQuality: 100 }).toBuffer());
}

execFileSync("node", ["scripts/cutout-white.mjs", "assets-src/ai/armazem-docas.webp", `${OUT}/armazem-docas.webp`, "236"], { stdio: "inherit" });
console.log("service cut-outs written to", OUT);
