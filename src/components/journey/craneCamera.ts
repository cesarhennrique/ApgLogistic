import { CRANE_BOUNDS, SPREADER } from "./craneAnchors";
import type { Camera, View } from "./oceanCamera";

// Scene 2's camera over the crane image (craneAnchors): it opens on a close of the APG container under the
// spreader, as scene 1 closed on one, and pulls back while the container rises, until the whole crane shows.

// The pull-back runs over this stretch of the scene's progress, then the wide shot holds.
export const ZOOM = [0, 0.78] as const;
// The close: the container this share of the screen's width...
export const CLOSE_SHARE = 0.45;
// ...unless that magnifies a pixel of the crane image past this many device pixels.
const MAX_PIXEL_SCALE = 1.5;

// The container hangs under the spreader, as wide as it (the side of a 40 ft box: 1266×293 in its own image).
export const CONTAINER = { x: SPREADER.x, w: SPREADER.w, top: SPREADER.bottom - 16, h: (SPREADER.w * 293) / 1266 };
// Its centre with the load lowered by dy (crane px; 0 when it is up at the trolley).
export const containerCentre = (dy: number) => ({ x: CONTAINER.x + CONTAINER.w / 2, y: CONTAINER.top + CONTAINER.h / 2 + dy });

// Where the whole crane ends up: right of the copy on wide screens, under it on phones.
export function frameRegion({ width, height }: View) {
  if (width >= 768) return { x0: 0.42 * width, x1: width - Math.max(0.03 * width, 24), y0: 104, y1: height - 0.04 * height };
  return { x0: 16, x1: width - 16, y0: 0.38 * height, y1: height - 0.03 * height };
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function sampleCraneCamera(p: number, view: View, dy: number): Camera {
  const region = frameRegion(view);
  const bw = CRANE_BOUNDS.x1 - CRANE_BOUNDS.x0;
  const bh = CRANE_BOUNDS.y1 - CRANE_BOUNDS.y0;
  const s0 = Math.min((CLOSE_SHARE * view.width) / CONTAINER.w, MAX_PIXEL_SCALE / view.dpr);
  const s1 = Math.min((region.x1 - region.x0) / bw, (region.y1 - region.y0) / bh);
  // Exponential: the same speed of pull-back all the way.
  const t = clamp01((p - ZOOM[0]) / (ZOOM[1] - ZOOM[0]));
  const scale = s0 * (s1 / s0) ** t;
  // From following the container (at the screen's centre) to framing the crane (at its region's centre), in step
  // with the scale, as scene 1's camera does: no swerve.
  const k = s0 !== s1 ? (1 - s0 / scale) / (1 - s0 / s1) : 1;
  const c = containerCentre(dy);
  const px = lerp(c.x, (CRANE_BOUNDS.x0 + CRANE_BOUNDS.x1) / 2, k);
  const py = lerp(c.y, (CRANE_BOUNDS.y0 + CRANE_BOUNDS.y1) / 2, k);
  const ax = lerp(view.width / 2, (region.x0 + region.x1) / 2, k);
  const ay = lerp(view.height / 2, (region.y0 + region.y1) / 2, k);
  return { x: ax - scale * px, y: ay - scale * py, scale };
}
