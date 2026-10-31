import { CONTAINER_BOX, CRANE_BOUNDS, GROUND, SPREADER, TRUCK, TRUCK_ROAD_Y } from "./craneAnchors";
import type { Camera, View } from "./oceanCamera";

// Scene 2's camera over the crane image (craneAnchors): it opens wide on the whole crane, the APG container up at the
// trolley, and zooms in, exponentially, as the container comes down, ending close on the truck waiting under the
// spreader, framed as scene 3 opens on it.

// The pixel limit: never more than this many device pixels to a pixel of the crane image.
const MAX_PIXEL_SCALE = 1.5;

// The container hangs under the spreader, as wide as it (the side of a 40 ft box: 1266×293 in its own image).
export const CONTAINER = { x: SPREADER.x, w: SPREADER.w, top: SPREADER.bottom - 16, h: (SPREADER.w * 293) / 1266 };
// Metres: a 40 ft container is 12.19 m long.
export const PX_PER_M = CONTAINER.w / 12.19;

// The truck waiting on the quay under the spreader, at the crane's scale (its container box as wide as the APG
// container), its tyres on the ground: its box in the crane image.
export const TRUCK_SCALE = CONTAINER.w / CONTAINER_BOX.w;
export const TRUCK_IN_CRANE = {
  x: SPREADER.x - CONTAINER_BOX.x * TRUCK_SCALE,
  y: GROUND.y - TRUCK_ROAD_Y * TRUCK_SCALE,
  w: TRUCK.width * TRUCK_SCALE,
  h: TRUCK.height * TRUCK_SCALE,
};
// Scene 2 leaves the container this far above its seat as scene 3 pins (crane px): scene 3 sets it down at once.
export const HANDOFF_GAP = 0.12 * CONTAINER.h;
// How far the container comes down to sit in the truck's container box (crane px).
export const seatDrop = TRUCK_IN_CRANE.y + CONTAINER_BOX.y * TRUCK_SCALE - CONTAINER.top;

// The wide shot: the whole crane and the quay under it (and, on wide screens, the ship's side at the left).
export const WIDE = ({ width }: View) =>
  width >= 768
    ? { x0: 0, y0: CRANE_BOUNDS.y0, x1: CRANE_BOUNDS.x1, y1: GROUND.y + 220 }
    : { x0: 1300, y0: CRANE_BOUNDS.y0, x1: CRANE_BOUNDS.x1, y1: GROUND.y + 120 };

// Where the wide shot fits.
export function frameRegion({ width, height }: View) {
  const header = width >= 768 ? 80 : 64;
  return { x0: Math.max(0.04 * width, 16), x1: width - Math.max(0.04 * width, 16), y0: header + 24, y1: height - 24 };
}

// The close: on wide screens the truck as scene 3 frames it (TRUCK_FRAME: 90vw, centred at 54% of the height); on
// phones the container at the centre, 1.4 screens wide (scene 3's close there). Within the pixel limit.
function close(view: View) {
  const truckCentre = { x: TRUCK_IN_CRANE.x + TRUCK_IN_CRANE.w / 2, y: TRUCK_IN_CRANE.y + TRUCK_IN_CRANE.h / 2 };
  const seated = { x: CONTAINER.x + CONTAINER.w / 2, y: CONTAINER.top + seatDrop + CONTAINER.h / 2 };
  const limit = MAX_PIXEL_SCALE / view.dpr;
  return view.width >= 768
    ? { scale: Math.min((0.9 * view.width) / TRUCK_IN_CRANE.w, limit), point: truckCentre, at: { x: view.width / 2, y: 0.54 * view.height } }
    : { scale: Math.min((1.4 * view.width) / CONTAINER.w, limit), point: seated, at: { x: view.width / 2, y: view.height / 2 } };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// t: the zoom's progress (0 wide, 1 close).
export function sampleCraneCamera(t: number, view: View): Camera {
  const wide = WIDE(view);
  const region = frameRegion(view);
  const s0 = Math.min((region.x1 - region.x0) / (wide.x1 - wide.x0), (region.y1 - region.y0) / (wide.y1 - wide.y0));
  const end = close(view);
  const tt = Math.min(Math.max(t, 0), 1);
  const scale = s0 * (end.scale / s0) ** tt;
  // From the wide shot's centre to the close's, in step with the scale (scene 1's camera): no swerve.
  const k = s0 !== end.scale ? (1 - s0 / scale) / (1 - s0 / end.scale) : 1;
  const px = lerp((wide.x0 + wide.x1) / 2, end.point.x, k);
  const py = lerp((wide.y0 + wide.y1) / 2, end.point.y, k);
  const ax = lerp((region.x0 + region.x1) / 2, end.at.x, k);
  const ay = lerp((region.y0 + region.y1) / 2, end.at.y, k);
  return { x: ax - scale * px, y: ay - scale * py, scale };
}

// Where scene 2 leaves the truck on screen (its box), for scene 3 to open on the same picture.
export function craneHandoff(view: View) {
  const cam = sampleCraneCamera(1, view);
  return {
    scale: cam.scale,
    truck: {
      x: cam.x + cam.scale * TRUCK_IN_CRANE.x,
      y: cam.y + cam.scale * TRUCK_IN_CRANE.y,
      w: cam.scale * TRUCK_IN_CRANE.w,
      h: cam.scale * TRUCK_IN_CRANE.h,
    },
  };
}
