// The phone's journey clips (M3; MobileJourney): the desktop journey filmed at a phone's size, frame by frame, its
// texts hidden (html[data-recording], globals.css: the phone sets them in HTML over and under the videos).
// For every frame: the scroll set to the scene's progress, two animation frames, a screenshot (never in real time:
// a clip comes out smooth however slow the machine). Then H.264 (ffmpeg-static), and each clip's first and last
// frames as AVIF and WebP (its poster, and the still shown when a video can't play).
//
//   npm run clips [-- http://localhost:3200] [-- --only navio,carga]
//
// Needs the site running at that address (default: the production build, npm run build && npm run start -- -p 3200).
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import ffmpeg from "ffmpeg-static";
import sharp from "sharp";

const args = process.argv.slice(2);
const BASE = args.find((a) => a.startsWith("http")) ?? "http://localhost:3200";
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const OUT = "public/video/jornada";
const FPS = 30;
// The video's width (its height in proportion, even), its quality (x264's CRF), the stills' budget.
const WIDTH = 720;
const CRF = 27;
const STILL_MAX = 60 * 1024;

// Each clip: the scene, its (desktop) progress from and to, its length. The stretches where its stage is pinned:
// scene 1 and 3 slide in over the scene before for their first 100vh, scene 4's phases (estradaScript) in vh.
const ESTRADA = 1270;
const CLIPS = [
  // the ship's arrival, the camera from wide to the client's container
  { name: "navio", scene: "chegada", from: 100 / 320, to: 1, seconds: 5 },
  // the container coming down to the truck, the camera from the whole crane to the close
  { name: "porteiner", scene: "porteiner", from: 0, to: 1, seconds: 5 },
  // the truck taking the container, the spreader rising away
  { name: "carga", scene: "carga", from: 100 / 320, to: 220 / 320, seconds: 4 },
  // A and B: the truck side on, driving off, the camera rising to straight above
  { name: "estrada-a", scene: "estrada", from: 100 / ESTRADA, to: 550 / ESTRADA, seconds: 4 },
  // C and D: the track's curves to the CONE terminal's dock
  { name: "estrada-b", scene: "estrada", from: 550 / ESTRADA, to: 1170 / ESTRADA, seconds: 6 },
].filter((c) => !only || only.includes(c.name));

// The scroll at which a scene's (desktop) progress is p, on a phone's screen: its data-scroll (Scene).
const sceneY = (id, p) => {
  const s = document.getElementById(id);
  const [range, from, head, tail, scale] = s.dataset.scroll.split(" ").map((v, i) => (i === 1 ? v : Number(v)));
  const mid = range - head - tail;
  const vh = p * range;
  const at = innerWidth >= 768 || scale === 1 ? vh : vh < head ? vh : vh < head + mid ? head + (vh - head) * scale : vh - (1 - scale) * mid;
  const top = s.getBoundingClientRect().top + window.scrollY - (from === "slide" ? innerHeight : 0);
  return top + (at / 100) * innerHeight;
};
const twoFrames = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
// every image of the scene with a source in
const imagesIn = (id) =>
  [...document.querySelectorAll(`#${id} img`)].filter((i) => i.getAttribute("src")).every((i) => i.complete && i.naturalWidth > 0);

// A still under the budget: the best quality that fits.
async function still(png, file) {
  for (const [ext, encode] of [
    ["avif", (q) => sharp(png).resize({ width: WIDTH }).avif({ quality: q, effort: 6 })],
    ["webp", (q) => sharp(png).resize({ width: WIDTH }).webp({ quality: q, effort: 6 })],
  ]) {
    for (let q = 70; ; q -= 5) {
      const out = `${file}.${ext}`;
      await encode(q).toFile(out);
      if (statSync(out).size <= STILL_MAX || q <= 10) break;
    }
  }
}

const browser = await chromium.launch({ headless: false, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.addInitScript(() => sessionStorage.setItem("apg-intro", "1"));
await page.goto(`${BASE}/?record`);
await page.waitForLoadState("load");
await page.locator("#chegada").waitFor({ state: "attached", timeout: 60_000 });
await page.evaluate(() => document.documentElement.setAttribute("data-recording", ""));
// (and the browser's own: the scrollbar, a dev server's badge)
await page.addStyleTag({ content: "html { scrollbar-width: none } nextjs-portal { display: none }" });
mkdirSync(OUT, { recursive: true });

for (const clip of CLIPS) {
  const frames = clip.seconds * FPS;
  const dir = mkdtempSync(path.join(tmpdir(), `clip-${clip.name}-`));
  const go = (p) => page.evaluate(([id, p]) => window.scrollTo({ top: Math.round(sceneY(id, p)), behavior: "instant" }), [clip.scene, p]);
  await page.evaluate(`window.sceneY = ${sceneY}; window.twoFrames = ${twoFrames}; window.imagesIn = ${imagesIn}`);
  // the scene's images in (they load as it comes near), the first frame drawn
  await go(clip.from);
  await page.waitForFunction((id) => imagesIn(id), clip.scene, { timeout: 60_000 });
  await page.waitForTimeout(2000);
  for (let f = 0; f < frames; f++) {
    await go(clip.from + ((clip.to - clip.from) * f) / (frames - 1));
    await page.evaluate(() => twoFrames());
    await page.screenshot({ path: path.join(dir, `${String(f).padStart(4, "0")}.png`) });
  }
  const mp4 = `${OUT}/${clip.name}.mp4`;
  execFileSync(ffmpeg, [
    ...["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(dir, "%04d.png")],
    ...["-vf", `scale=${WIDTH}:-2:flags=lanczos`, "-c:v", "libx264", "-profile:v", "high", "-preset", "veryslow"],
    ...["-crf", String(CRF), "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", mp4],
  ]);
  await still(path.join(dir, "0000.png"), `${OUT}/${clip.name}-poster`);
  await still(path.join(dir, `${String(frames - 1).padStart(4, "0")}.png`), `${OUT}/${clip.name}-fim`);
  rmSync(dir, { recursive: true, force: true });
  console.log(`${clip.name}: ${(statSync(mp4).size / 1e6).toFixed(2)} MB`);
}
await browser.close();
