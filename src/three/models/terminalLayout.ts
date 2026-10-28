import { SCENE_POSITIONS } from "../camera-path";
import { TERMINAL_BLOCKS } from "./stackLayout";

// The CONE terminal's layout around its stack blocks (meters, world space). Pure data: Terminal builds it,
// the yard lights and the container material read the mast positions.

const [tx, , tz] = SCENE_POSITIONS.terminal;
// Yard slab, local to the terminal.
export const YARD = { x0: tx - 62, x1: tx + 62, z0: tz - 70, z1: tz + 48 };

// Warehouse (cross-docking): 46 docks, 23 on each long face; the front faces the yard.
export const DOCKS_PER_FACE = 23;
export const DOCK_PITCH = 3.6;
export const HALL = { x: tx, z: tz - 45, length: DOCKS_PER_FACE * DOCK_PITCH + 1.2, depth: 18, height: 10 };
export const DOCK_FLOOR = 1.3;

// Lanes run between the stack blocks: x between columns, z between the two rows and in front of the hall.
export const xs = [...new Set(TERMINAL_BLOCKS.map((b) => b.x))].sort((a, b) => a - b);
export const zs = [...new Set(TERMINAL_BLOCKS.map((b) => b.z))].sort((a, b) => b - a);
const hx = TERMINAL_BLOCKS[0].hx;
const hz = TERMINAL_BLOCKS[0].hz;
// Blocks share one size, so a lane between two blocks sits midway between their centers.
export const laneX = xs.slice(1).map((x, i) => (x + xs[i]) / 2);
export const laneZ = [(zs[0] + zs[1]) / 2, (zs[1] - hz + HALL.z + HALL.depth / 2) / 2];

// High-mast lights at the lane crossings and the yard's ends.
export const MASTS: [number, number][] = [
  ...laneX.flatMap((x) => laneZ.map((z) => [x, z] as [number, number])),
  [xs[0] - hx - 6, laneZ[0]],
  [xs[xs.length - 1] + hx + 6, laneZ[0]],
  ...laneX.map((x) => [x, zs[0] + hz + 6] as [number, number]),
];
export const MAST_HEIGHT = 25;
