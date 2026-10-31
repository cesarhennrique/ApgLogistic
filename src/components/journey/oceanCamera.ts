// Scene 1's camera over one still photo (assets-src/ai/navio-mar.webp): it starts high, the whole photo on screen
// with the ship at its centre, and comes down to find the APG container: the deck fills the screen around TARGET.
// Points are in pixels of the original photo, measured on crops saved with sharp.
export const PHOTO = { width: 6688, height: 3764 };
// The ship lies vertically, its bow up: the centre of its hull, the hull's width and the tip of its bow.
export const SHIP = { x: 3359, y: 1747 };
export const HULL_WIDTH = 662;
export const BOW = { x: 3356, y: 325 };

export type Rect = { x: number; y: number; w: number; h: number };
// The navy containers with the red stripe (APG's), bow to stern.
export const APG_CONTAINERS: Rect[] = [
  { x: 3225, y: 936, w: 123, h: 234 },
  { x: 3070, y: 1195, w: 112, h: 224 },
  { x: 3375, y: 1431, w: 118, h: 236 },
  { x: 3227, y: 1690, w: 127, h: 245 },
  { x: 3364, y: 1943, w: 129, h: 257 },
  { x: 3199, y: 2212, w: 124, h: 253 },
];
// The client's container, near the middle of the deck: the close centres on it, and it is the one the gantry crane
// lifts in scene 2.
export const TARGET = APG_CONTAINERS[3];
export const FOCUS = { x: TARGET.x + TARGET.w / 2, y: TARGET.y + TARGET.h / 2 };

// The zoom runs from the start of the scene's progress (the photo already covers the screen) to the close, which
// then holds.
export const ZOOM = [0, 0.8] as const;
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

// A photo point on screen: the same math as cameraTransform.
export const toScreen = ({ x, y, scale }: Camera, p: { x: number; y: number }) => ({ x: x + scale * p.x, y: y + scale * p.y });

// The camera as one transform on the photo's box (its origin at the top left).
export const cameraTransform = ({ x, y, scale }: Camera) =>
  `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;

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
