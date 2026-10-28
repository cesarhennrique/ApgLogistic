import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { ChapterId } from "./chapters";

// Where each chapter's scene sits on the ground, in meters (1 unit = 1 m; a 40' box is 12.19 long).
// The port details (quay, crane, truck lane) are in anchors.ts. Everything sits right of the hero's view:
// the sun sets to the left, and nothing tall may stand between it and the hero camera.
export const SCENE_POSITIONS: Record<ChapterId, [number, number, number]> = {
  hero: [0, 0, 0],
  crane: [40, 0, -56],
  load: [42, 0, -56],
  highway: [90, 0, -130],
  terminal: [110, 0, -220],
  distribution: [60, 0, -330],
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// One key per chapter boundary (t = 0, 0.2 … 1): the camera arrives on a scene as its chapter ends.
// shortcut: framing is first-pass, at the meter scale; Prompt 13 directs the camera properly.
export const CAMERA_KEYS = [
  // Hero: low over the water, pitched ~12° down so the horizon and the ship sit above the h1 (legibility).
  { position: v(-2, 2.5, 16), target: v(0, -1, 0) },
  // Crane: from over the water, along the quay: the ship's bay and the spreader seating on the box, clear
  // of the crane's legs.
  { position: v(16, 9, -14), target: v(30, 8, -56) },
  // Load: down the truck lane, between the legs, the box coming onto the trailer.
  { position: v(50, 7, -20), target: v(42, 8, -56) },
  // Highway (Prompt 12).
  { position: v(104, 4, -120), target: v(86, 1, -136) },
  // Terminal: aerial over the CONE yard.
  { position: v(145, 55, -165), target: v(110, 0, -222) },
  // Distribution (Prompt 12).
  { position: v(74, 14, -312), target: v(60, 0, -330) },
];

const positionCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => k.position));
const targetCurve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => k.target));
const segments = CAMERA_KEYS.length - 1;

export type CameraSample = { position: Vector3; target: Vector3 };

// Smootherstep inside each segment, so the camera eases in and out of every key.
export function sampleCamera(
  t: number,
  out: CameraSample = { position: new Vector3(), target: new Vector3() },
): CameraSample {
  const p = MathUtils.clamp(t, 0, 1) * segments;
  const i = Math.min(Math.floor(p), segments - 1);
  // getPoint (not getPointAt) hits key i exactly at i / segments.
  const u = (i + MathUtils.smootherstep(p - i, 0, 1)) / segments;
  positionCurve.getPoint(u, out.position);
  targetCurve.getPoint(u, out.target);
  return out;
}
