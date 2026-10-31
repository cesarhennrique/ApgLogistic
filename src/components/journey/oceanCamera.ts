// Scene 1's camera over one still photo (assets-src/ai/navio-mar.webp): it starts high, the whole photo on screen
// with the ship at its centre, and comes down until the deck fills the screen around FOCUS. Points are in pixels of
// the original photo, measured on crops saved with sharp.
export const PHOTO = { width: 6688, height: 3764 };
// The ship lies vertically, its bow up: the centre of its hull, the hull's width and its bow.
export const SHIP = { x: 3359, y: 1747 };
export const HULL_WIDTH = 662;
export const BOW = { x: 3358, y: 330 };
// The middle block of the deck, between two navy containers with the red stripe: one of them is the container the
// gantry crane lifts in scene 2.
export const FOCUS = { x: 3364, y: 1675 };

// The zoom runs over this stretch of the scene's progress; before it the wide framing holds, after it the close.
export const ZOOM = [0.08, 0.85] as const;
// The close: the hull this share of the screen's height (or the screen's full width, on a narrow screen)...
export const HULL_FILL = 0.9;
// ...unless that magnifies a pixel of the original past this many device pixels: then the zoom stops there.
export const MAX_PIXEL_SCALE = 1.5;

export type View = { width: number; height: number; dpr: number };
// The photo's placement on screen: a photo point (u, v) lands at (x + scale·u, y + scale·v), in CSS pixels.
export type Camera = { x: number; y: number; scale: number };

// The wide framing: the photo covering the screen.
const cover = ({ width, height }: View) => Math.max(width / PHOTO.width, height / PHOTO.height);

// How far the camera comes down: the zoom over the wide framing at the close.
export function maxZoom(view: View) {
  const c = cover(view);
  const fill = Math.min(HULL_FILL * view.height, view.width) / (HULL_WIDTH * c);
  return Math.max(1, Math.min(fill, MAX_PIXEL_SCALE / (c * view.dpr)));
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function sampleOceanCamera(p: number, view: View): Camera {
  const c = cover(view);
  const zmax = maxZoom(view);
  // The wide framing: the ship at the screen's centre, as far as the photo's edges allow.
  const halfW = view.width / 2 / c;
  const halfH = view.height / 2 / c;
  const start = { x: clamp(SHIP.x, halfW, PHOTO.width - halfW), y: clamp(SHIP.y, halfH, PHOTO.height - halfH) };
  // Exponential: the same descent speed all the way (a linear scale speeds up at the end).
  const t = clamp((p - ZOOM[0]) / (ZOOM[1] - ZOOM[0]), 0, 1);
  const zoom = zmax ** t;
  // One straight zoom about the photo point that stays put on screen, chosen so the screen's centre goes from the
  // ship to FOCUS as the scale grows: no swerve on the way down.
  const k = zmax > 1 ? (1 - 1 / zoom) / (1 - 1 / zmax) : 0;
  const cx = start.x + (FOCUS.x - start.x) * k;
  const cy = start.y + (FOCUS.y - start.y) * k;
  const scale = c * zoom;
  return { x: view.width / 2 - scale * cx, y: view.height / 2 - scale * cy, scale };
}
