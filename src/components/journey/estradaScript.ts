import truckViews from "@/content/truckViews.json";
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

// The four views of the truck, each pointing left, as scripts/build-truck-views.mjs measured them on the cut-outs
// (px): the rig's front (the cab's nose) and rear, its top and bottom, and the rear wheel's contact point.
const VIEW = (name: keyof typeof truckViews) => ({ name, ...truckViews[name] });
export const TRUCK_VIEWS = {
  lado: VIEW("carreta-lado"),
  alto30: VIEW("carreta-alto-30"),
  alto60: VIEW("carreta-alto-60"),
  cima: VIEW("carreta-cima"),
};
export type TruckView = (typeof TRUCK_VIEWS)[keyof typeof TRUCK_VIEWS];

// A view's box in the side view's px (its scale k and its top-left corner), fitted on two points: the rear wheel's
// contact and the cab's nose, so the swaps keep the truck's length and its rear wheels on the ground where they were.
export function viewFit(v: TruckView) {
  const side = TRUCK_VIEWS.lado;
  const k = (side.wheel.x - side.front) / (v.wheel.x - v.front);
  return { k, left: side.wheel.x - v.wheel.x * k, top: side.wheel.y - v.wheel.y * k };
}

// The point the camera holds through B and the truck turns about in C (side view px): the middle of its footprint
// seen from above.
export function rigCentre() {
  const top = TRUCK_VIEWS.cima;
  const fit = viewFit(top);
  return { x: fit.left + ((top.front + top.rear) / 2) * fit.k, y: fit.top + ((top.top + top.bottom) / 2) * fit.k };
}

// B: the camera's angle over the ground, 0° (side on) to 90° (straight above), easing in and out of the phase.
export const thetaAt = (b: number) => 45 * (1 - Math.cos(Math.PI * Math.min(Math.max(b, 0), 1)));

// The views' opacities at the angle θ: each view whole at its own angle (0°, 30°, 60°, 90°), the crossfades between
// two neighbours centred halfway, each over 18° (a fifth of the phase), overlapping: the incoming view fades in
// over the outgoing one, which only goes once the incoming is half in (never a see-through moment).
const ANGLES = [0, 30, 60, 90];
const FADE = 18;
export function viewWeights(theta: number) {
  const w = [1, 0, 0, 0];
  for (let i = 1; i < 4; i++) {
    const mid = (ANGLES[i - 1] + ANGLES[i]) / 2;
    const t = segment(theta, mid - FADE / 2, mid + FADE / 2);
    w[i] = t;
    w[i - 1] *= 1 - segment(t, 0.5, 1);
  }
  return w;
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
