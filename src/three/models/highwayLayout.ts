import { SCENE_POSITIONS } from "../camera-path";

const [x, , z] = SCENE_POSITIONS.highway;

// BR-101 at the 'highway' scene: a divided road running east–west (X), median at z. The APG truck drives +X
// in the right-hand carriageway (+Z side), outer lane. The strip is long enough that its ends sit in the fog;
// everything on it scrolls in a loop under the standing truck.
export const HIGHWAY = {
  x,
  z,
  length: 700,
  roadY: 0.04,
  lane: 3.6,
  // Median half-width (to the inner edge of each carriageway) and each carriageway's shoulder.
  median: 1.5,
  shoulder: 2.4,
  truckLaneZ: z + 1.5 + 3.6 * 1.5,
  verge: 26,
};

const from = HIGHWAY.x - HIGHWAY.length / 2;

// Where something laid out at x0 is once the truck has driven `scroll` meters: moved back (-X), wrapped to the strip.
export function loopX(x0: number, scroll: number): number {
  const t = (((x0 - scroll - from) % HIGHWAY.length) + HIGHWAY.length) % HIGHWAY.length;
  return from + t;
}
