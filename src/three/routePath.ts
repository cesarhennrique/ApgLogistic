import { CatmullRomCurve3, MathUtils, Vector3 } from "three";
import { QUAY_TOP, TRUCK_LOAD_POINT } from "./anchors";
import { GALPAO_DOOR, MAP_TOP, SALVADOR } from "./models/distributionLayout";
import { HIGHWAY } from "./models/highwayLayout";
import { HALL } from "./models/terminalLayout";

// The red route: on the ground from the crane's lane to the map, linking port, highway, terminal and client.
// Each scene's point carries the progress at which the line reaches it; corners in between have none.
const LIFT = 0.15;
const ground = (x: number, z: number, y = 0) => new Vector3(x, y + LIFT, z);
const laneZ = HIGHWAY.truckLaneZ;

// Along the truck's drive (truckPose): down the lane, the right turn, the near carriageway; then the yard, the
// warehouse at Suape and across the map to Salvador.
const turn = TRUCK_LOAD_POINT.x + (-150 - laneZ);
const POINTS: { point: Vector3; progress?: number }[] = [
  { point: ground(TRUCK_LOAD_POINT.x, TRUCK_LOAD_POINT.z, QUAY_TOP), progress: 0 },
  { point: ground(TRUCK_LOAD_POINT.x, -150, QUAY_TOP), progress: 0.46 },
  { point: ground(turn - (turn - TRUCK_LOAD_POINT.x) * Math.SQRT1_2, -150 - (-150 - laneZ) * Math.SQRT1_2) },
  { point: ground(turn, laneZ), progress: 0.5 },
  { point: ground(HIGHWAY.x, laneZ), progress: 0.52 },
  { point: ground(HIGHWAY.x + 60, laneZ), progress: 0.62 },
  { point: ground(HIGHWAY.x + 72, laneZ - 22) },
  { point: ground(HALL.x + 20, HALL.z + 16), progress: 0.75 },
  { point: ground(GALPAO_DOOR.x + 12, GALPAO_DOOR.z + 14) },
  { point: ground(GALPAO_DOOR.x, GALPAO_DOOR.z, MAP_TOP), progress: 0.9 },
  { point: ground(SALVADOR.x, SALVADOR.z, MAP_TOP), progress: 1 },
];

export const ROUTE_CURVE = new CatmullRomCurve3(POINTS.map((p) => p.point), false, "centripetal");

// Arc length at each control point (getPoint(i / (n - 1)) passes through point i).
const STEPS = 64;
const lengths = ROUTE_CURVE.getLengths((POINTS.length - 1) * STEPS);
export const ROUTE_LENGTH = lengths[lengths.length - 1];

export const ROUTE_KNOTS = POINTS.flatMap((p, i) =>
  p.progress === undefined ? [] : [{ point: p.point, progress: p.progress, length: lengths[i * STEPS] }],
);

// How much of the line (meters from the port) is drawn at a global progress.
export function revealAt(progress: number): number {
  const p = MathUtils.clamp(progress, 0, 1);
  for (let k = 1; k < ROUTE_KNOTS.length; k++) {
    const a = ROUTE_KNOTS[k - 1];
    const b = ROUTE_KNOTS[k];
    if (p <= b.progress) return MathUtils.lerp(a.length, b.length, (p - a.progress) / (b.progress - a.progress));
  }
  return ROUTE_LENGTH;
}
