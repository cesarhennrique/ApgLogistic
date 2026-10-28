import { MathUtils, Vector3 } from "three";
import { QUAY_TOP, TRAILER_BED_HEIGHT, TRUCK_LOAD_POINT } from "./anchors";
import { HIGHWAY } from "./models/highwayLayout";

// Leaves once the box is on (0.4) and the spreader is clear: down the crane's lane toward the quay's south end,
// a right turn onto the BR-101's near carriageway, and along it to the standing point it keeps from 0.52 while
// the road loops past. The camera follows (its highway key is at 0.52).
export const LEAVE = [0.42, 0.52] as const;
// 80 km/h on the highway.
export const CRUISE = 22;

const START = { x: TRUCK_LOAD_POINT.x, z: TRUCK_LOAD_POINT.z };
// The lane runs straight to here, then a quarter turn whose radius lands it exactly on the truck lane.
const TURN_Z = -150;
const R = TURN_Z - HIGHWAY.truckLaneZ;
const L1 = START.z - TURN_Z;
const L2 = (Math.PI / 2) * R;
const L3 = HIGHWAY.x - (START.x + R);
const LENGTH = L1 + L2 + L3;
// The quay deck (QUAY_TOP) ramps down to the road over its south end.
const RAMP = [-180, -172] as const;

export type TruckPose = {
  // Where TRUCK_LOAD_POINT (the trailer bed's top center) is.
  position: Vector3;
  // Radians about Y: π faces -Z (parked in the crane's lane), π/2 faces +X (the highway).
  yaw: number;
  onHighway: boolean;
  // m/s on the highway (per unit of progress while leaving; only "rolling" vs "parked" matters there), and
  // meters driven on the highway (the road and its props scroll by this).
  speed: number;
  scroll: number;
};

export function truckPoseAt(
  progress: number,
  seconds: number,
  reducedMotion: boolean,
  out: TruckPose = { position: new Vector3(), yaw: 0, onHighway: false, speed: 0, scroll: 0 },
): TruckPose {
  if (progress >= LEAVE[1]) {
    out.position.set(HIGHWAY.x, HIGHWAY.roadY + TRAILER_BED_HEIGHT, HIGHWAY.truckLaneZ);
    out.yaw = Math.PI / 2;
    out.onHighway = true;
    out.speed = reducedMotion ? 0 : CRUISE;
    out.scroll = reducedMotion ? 0 : CRUISE * seconds;
    return out;
  }
  const u = MathUtils.clamp((progress - LEAVE[0]) / (LEAVE[1] - LEAVE[0]), 0, 1);
  const s = LENGTH * MathUtils.smoothstep(u, 0, 1);
  let x: number;
  let z: number;
  if (s < L1) {
    x = START.x;
    z = START.z - s;
    out.yaw = Math.PI;
  } else if (s < L1 + L2) {
    // Around the turn's center, from heading -Z to heading +X.
    const a = (s - L1) / R;
    x = START.x + R - R * Math.cos(a);
    z = TURN_Z - R * Math.sin(a);
    out.yaw = Math.atan2(Math.sin(a), -Math.cos(a));
  } else {
    x = START.x + R + (s - L1 - L2);
    z = HIGHWAY.truckLaneZ;
    out.yaw = Math.PI / 2;
  }
  const deck = MathUtils.lerp(HIGHWAY.roadY, QUAY_TOP, MathUtils.smoothstep(z, RAMP[0], RAMP[1]));
  out.position.set(x, deck + TRAILER_BED_HEIGHT, z);
  out.onHighway = false;
  out.speed = u > 0 && u < 1 ? (6 * LENGTH * u * (1 - u)) / (LEAVE[1] - LEAVE[0]) : 0;
  out.scroll = 0;
  return out;
}
