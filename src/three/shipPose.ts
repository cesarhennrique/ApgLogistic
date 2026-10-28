import { MathUtils, type Object3D, Vector3 } from "three";
import { SHIP_POSITION } from "./anchors";

// The hero's ship glides into its berth on time (not scroll): 30 m in 12 s, easing to a stop.
export const SLIDE = { distance: 30, seconds: 12 };
const ROLL = MathUtils.degToRad(0.6);
const ROLL_PERIOD = 9;
// By this progress the ship is docked and still, well before the spreader seats on its box (0.15).
export const DOCKED_BY = 0.08;

export type ShipPose = {
  // Meters short of the berth, along -Z (the ship sails toward +Z).
  slide: number;
  // Radians about the ship's length (Z).
  roll: number;
  // m/s, for the wake.
  speed: number;
};

export function shipPoseAt(seconds: number, progress: number, reducedMotion: boolean): ShipPose {
  if (reducedMotion) return { slide: 0, roll: 0, speed: 0 };
  const weight = 1 - MathUtils.smoothstep(progress, 0, DOCKED_BY);
  if (weight === 0) return { slide: 0, roll: 0, speed: 0 };
  const x = Math.min(seconds / SLIDE.seconds, 1);
  // Ease-out cubic: under way at first, settling into the berth.
  const left = (1 - x) ** 3;
  return {
    slide: SLIDE.distance * left * weight,
    roll: ROLL * Math.sin((2 * Math.PI * seconds) / ROLL_PERIOD) * weight,
    speed: x < 1 ? ((SLIDE.distance * 3 * (1 - x) ** 2) / SLIDE.seconds) * weight : 0,
  };
}

// This frame's pose, written by Ship and read by Crane (the box it picks rides the ship until lifted).
export const shipPose: ShipPose = { slide: 0, roll: 0, speed: 0 };

const Z = new Vector3(0, 0, 1);
const local = new Vector3();

// Places an object given at its berth position (world) where it is on the moving ship right now.
export function placeOnShip(atBerth: Vector3, target: Object3D) {
  local.subVectors(atBerth, SHIP_POSITION).applyAxisAngle(Z, shipPose.roll);
  target.position.copy(SHIP_POSITION).add(local);
  target.position.z -= shipPose.slide;
  target.rotation.set(0, 0, shipPose.roll);
}
