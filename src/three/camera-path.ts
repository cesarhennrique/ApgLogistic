import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { ChapterId } from "./chapters";

// Where each chapter's scene sits on the ground. Placeholders now, real models later.
export const SCENE_POSITIONS: Record<ChapterId, [number, number, number]> = {
  hero: [0, 0, 0],
  crane: [10, 0, -14],
  load: [18, 0, -30],
  highway: [10, 0, -50],
  terminal: [-6, 0, -66],
  distribution: [-20, 0, -82],
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// One key per chapter boundary (t = 0, 0.2 … 1): the camera arrives on a scene as its chapter ends.
export const CAMERA_KEYS = [
  // Hero: low over the water, pitched ~12° down so the horizon and the ship sit above the h1 (legibility).
  { position: v(-2, 2.5, 16), target: v(0, -1, 0) },
  { position: v(4, 9, -4), target: v(10, 4, -14) },
  { position: v(26, 6, -22), target: v(18, 1, -30) },
  { position: v(20, 3, -44), target: v(10, 1, -50) },
  { position: v(4, 26, -50), target: v(-6, 0, -66) },
  { position: v(-14, 12, -66), target: v(-20, 0, -82) },
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
