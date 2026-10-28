import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import type { ChapterId } from "./chapters";

// Where each chapter's scene sits on the ground, in meters (1 unit = 1 m; a 40' box is 12.19 long).
// The port details (quay, crane, truck lane) are in anchors.ts. Everything sits right of the hero's view:
// the sun sets to the left, and nothing tall may stand between it and the hero camera.
export const SCENE_POSITIONS: Record<ChapterId, [number, number, number]> = {
  hero: [0, 0, 0],
  crane: [49, 0, -110],
  load: [44, 0, -110],
  highway: [130, 0, -175],
  terminal: [130, 0, -260],
  distribution: [40, 0, -380],
};

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// One key per chapter boundary (t = 0, 0.2 … 1): the camera arrives on a scene as its chapter ends.
// shortcut: framing is first-pass, at the meter scale; Prompt 13 directs the camera properly.
export const CAMERA_KEYS = [
  // Hero: low over the water, pitched ~12° down so the horizon and the ship sit above the h1 (legibility).
  { position: v(-2, 2.5, 16), target: v(0, -1, 0) },
  // Crane: from the sea side, abeam of the docked ship: the 70 m crane against the sunset, the spreader
  // seating on the box at the top of the deck stacks (the superstructure is at the far end).
  { position: v(-55, 22, -66), target: v(30, 26, -116) },
  // Load: down the truck lane, between the legs, the box coming onto the trailer.
  { position: v(52, 7, -74), target: v(44, 8, -110) },
  // Highway (Prompt 12).
  { position: v(144, 4, -165), target: v(126, 1, -181) },
  // Terminal: aerial over the CONE yard.
  { position: v(165, 55, -205), target: v(130, 0, -262) },
  // Distribution (Prompt 12).
  { position: v(54, 14, -362), target: v(40, 0, -380) },
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
