import { segment } from "./segment";

// Scene 4, "Estrada" (spec §3, revision 2026-10-31b): one continuous scene, the truck always in frame while the
// camera rises from the side to straight above. It slides in over scene 3 (100vh), then:
// A, side on (the truck drives off, the services and differentials revealed as it passes them);
// B, the camera rises (the navy band becomes the road under the truck, the views swap: side → 30° → 60° → above);
// C, the track seen from above (S curves, the history's chapters as the truck reaches them);
// D, the arrival at the CONE terminal's dock (its numbers as a scoreboard).
export const ESTRADA_VH = { slide: 100, a: 300, b: 150, c: 500, d: 120 } as const;
// Phones scroll each phase over three quarters of the height (the slide stays a screen: it is scene 3's last one).
const PHONE = 0.75;

export const estradaHeightVh = (mobile: boolean) =>
  ESTRADA_VH.slide + (mobile ? PHONE : 1) * (ESTRADA_VH.a + ESTRADA_VH.b + ESTRADA_VH.c + ESTRADA_VH.d);

// Each phase's own progress at the scene's progress p.
export function phasesAt(p: number, mobile: boolean) {
  const k = mobile ? PHONE : 1;
  const vh = p * estradaHeightVh(mobile);
  const ends: number[] = [ESTRADA_VH.slide];
  for (const len of [ESTRADA_VH.a, ESTRADA_VH.b, ESTRADA_VH.c, ESTRADA_VH.d]) ends.push(ends[ends.length - 1] + k * len);
  return {
    slide: segment(vh, 0, ends[0]),
    a: segment(vh, ends[0], ends[1]),
    b: segment(vh, ends[1], ends[2]),
    c: segment(vh, ends[2], ends[3]),
    d: segment(vh, ends[3], ends[4]),
  };
}

// The road under the truck through A and B (t, 0–1 over both): it pulls away, speeds up over the first stretch
// (constant push), then cruises. The distance, as a share of the whole, and the speed, as a share of the cruise.
const RAMP = 0.15;
export const roadDistance = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return (x < RAMP ? (x * x) / (2 * RAMP) : RAMP / 2 + (x - RAMP)) / (1 - RAMP / 2);
};
export const roadSpeed = (t: number) => Math.min(Math.max(t, 0) / RAMP, 1);

// The four views of the truck (scripts/build-truck-views.mjs), each pointing left, measured on the cut-outs (px):
// the front and rear of the whole rig, and the anchor row it sits on (the tyres' line side on; seen from above, the
// middle of the footprint). Each is fitted to the side view by its length and its rear (viewFit), so the swaps
// keep the truck's size and its back where they were.
export const TRUCK_VIEWS = {
  lado: { name: "carreta-lado", width: 1672, height: 941, front: 20, rear: 1640, anchor: 701 },
  alto30: { name: "carreta-alto-30", width: 1915, height: 821, front: 77, rear: 1842, anchor: 600 },
  alto60: { name: "carreta-alto-60", width: 1916, height: 821, front: 73, rear: 1852, anchor: 540 },
  cima: { name: "carreta-cima", width: 1672, height: 941, front: 53, rear: 1575, anchor: 467 },
} as const;
export type TruckView = (typeof TRUCK_VIEWS)[keyof typeof TRUCK_VIEWS];

// A view's box in the side view's px: its scale (k) and its top-left corner.
export function viewFit(v: TruckView) {
  const side = TRUCK_VIEWS.lado;
  const k = (side.rear - side.front) / (v.rear - v.front);
  return { k, left: side.rear - v.rear * k, top: side.anchor - v.anchor * k };
}

const n = (v: number) => Math.round(v * 10) / 10;

// The track (world px, the truck's anchor at the origin when C starts, pointing left), in units of U, the truck's
// length from above. It comes in from the right along B's straight road; on wide screens it swings in wide S
// curves heading left, then turns down to the dock; on phones it turns down at once and swings gently, vertical
// in the middle of the screen. start: the length along it where C starts; end: where it stops, at the dock.
export function trackPath({ width }: { width: number; height: number }, U: number, mobile: boolean) {
  const parts = [`M${n(width)} 0H0`];
  let x = 0;
  let y = 0;
  if (!mobile) {
    // S curves: each a stretch of 4.5U heading left, from one side of the road's line to the other.
    const A = 1.6 * U;
    for (const next of [-A, A, -A, 0]) {
      parts.push(`C${n(x - 2.25 * U)} ${n(y)} ${n(x - 2.25 * U)} ${n(next)} ${n(x - 4.5 * U)} ${n(next)}`);
      [x, y] = [x - 4.5 * U, next];
    }
    parts.push(`C${n(x - 1.5 * U)} ${n(y)} ${n(x - 1.5 * U)} ${n(y)} ${n(x - 1.5 * U)} ${n(y + 1.5 * U)}`);
    [x, y] = [x - 1.5 * U, y + 1.5 * U];
    y += 3.5 * U;
  } else {
    parts.push(`C${n(-1.2 * U)} 0 ${n(-1.5 * U)} ${n(0.3 * U)} ${n(-1.5 * U)} ${n(1.5 * U)}`);
    [x, y] = [-1.5 * U, 1.5 * U];
    // gentle S curves heading down, 0.7U to either side of the middle
    const xc = x;
    for (const side of [1, -1, 1, -1, 0]) {
      const next = xc + side * 0.7 * U;
      parts.push(`C${n(x)} ${n(y + 2 * U)} ${n(next)} ${n(y + 2 * U)} ${n(next)} ${n(y + 4 * U)}`);
      [x, y] = [next, y + 4 * U];
    }
    y += 2.5 * U;
  }
  parts.push(`V${n(y)}`);
  return { d: parts.join(""), start: n(width), end: { x: n(x), y: n(y) } };
}
