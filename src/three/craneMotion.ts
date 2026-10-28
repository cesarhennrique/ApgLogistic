import { MathUtils, Vector3 } from "three";
import { QUAY_TOP, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "./anchors";
import { CONTAINER } from "./models/containerGeometry";

const H = CONTAINER["40"].height;

// Spreader bottom when fully hoisted: the hanging box clears the ship's 4-high deck stacks (and so the
// portal's 12 m sill beams), well under the trolley.
export const HOIST_TOP = QUAY_TOP + 22;
// Global progress where the spreader seats on the box (the "clack"); /?p=0.15 shows it.
export const LOCK_AT = 0.15;

// Global progress windows. 'crane' is 0–0.2, 'load' is 0.2–0.4.
const TROLLEY_OUT = [0, 0.09] as const; // over the ship
const LOWER_EMPTY = [0.09, LOCK_AT] as const; // down onto the box
const HOIST = [0.2, 0.26] as const; // up with the box
// Until then the box is cargo: it rides the ship.
export const LIFT_AT = HOIST[0];
const TROLLEY_IN = [0.26, 0.34] as const; // across, over the truck lane
const LOWER_LOADED = [0.34, 0.4] as const; // down onto the trailer
const RAISE_EMPTY = [0.4, 0.47] as const; // spreader lets go and climbs back

const seat = { ship: SHIP_PICK_POINT.y + H, truck: TRUCK_LOAD_POINT.y + H };

export type CraneState = { trolleyX: number; spreaderY: number; locked: boolean; container: Vector3 };

const ease = (p: number, [a, b]: readonly [number, number]) => MathUtils.smoothstep(p, a, b);

// Where the trolley, the spreader (its bottom face) and the moving box are at a global progress.
export function craneState(
  p: number,
  out: CraneState = { trolleyX: 0, spreaderY: 0, locked: false, container: new Vector3() },
): CraneState {
  const ship = SHIP_PICK_POINT.x;
  const truck = TRUCK_LOAD_POINT.x;

  out.trolleyX = MathUtils.lerp(
    MathUtils.lerp(truck, ship, ease(p, TROLLEY_OUT)),
    truck,
    ease(p, TROLLEY_IN),
  );

  if (p < HOIST[0]) out.spreaderY = MathUtils.lerp(HOIST_TOP, seat.ship, ease(p, LOWER_EMPTY));
  else if (p < LOWER_LOADED[0]) out.spreaderY = MathUtils.lerp(seat.ship, HOIST_TOP, ease(p, HOIST));
  else if (p < RAISE_EMPTY[0]) out.spreaderY = MathUtils.lerp(HOIST_TOP, seat.truck, ease(p, LOWER_LOADED));
  else out.spreaderY = MathUtils.lerp(seat.truck, HOIST_TOP, ease(p, RAISE_EMPTY));

  out.locked = p >= LOCK_AT && p < RAISE_EMPTY[0];

  if (p < HOIST[0]) out.container.copy(SHIP_PICK_POINT);
  else if (p >= RAISE_EMPTY[0]) out.container.copy(TRUCK_LOAD_POINT);
  else out.container.set(out.trolleyX, out.spreaderY - H, SHIP_PICK_POINT.z);
  return out;
}
