import { Vector3 } from "three";

// World layout of the port, in meters (1 scene unit = 1 m). Containers lie along Z, the crane's boom along X
// (sea to -X, land to +X), the quay edge runs along Z at QUAY_EDGE_X.

export const QUAY_TOP = 1.2;
export const QUAY_EDGE_X = 32;

// Crane base: center between its four legs, on the quay.
// Off to the right of the hero's view and ~120 m out, so from the hero the port and the docked ship sit in the
// upper right, not a wall.
// Its sea-side legs (30 m gauge) stand 2 m in from the quay edge.
export const CRANE_POSITION = new Vector3(QUAY_EDGE_X + 17, QUAY_TOP, -110);

// The ship's deck bay the crane works: bottom-center of the box it picks. Forward-most bay, the row nearest
// the quay, top of a 4-high column (the hatch covers' top is SHIP_DECK_Y).
export const SHIP_DECK_Y = 6.5;
export const SHIP_PICK_POINT = new Vector3(26, SHIP_DECK_Y + 3 * 2.591, CRANE_POSITION.z);

// Docked ship: hull center at the waterline, bow toward +Z (it comes in toward the hero camera). Seven rows of
// 40' on 2.74 m centers put the pick row (the seventh) at SHIP_PICK_POINT.x and the hull's quay side 3 m off
// the quay (fenders); the forward-most bay sits 36.75 m forward of center (shipGeometry's bayZ[6]), so the
// superstructure is at the far end, out of the crane shots.
export const SHIP_POSITION = new Vector3(SHIP_PICK_POINT.x - 3 * 2.738, 0, SHIP_PICK_POINT.z - 36.752);

// Bottom-center of the container once it rests on the APG trailer, in the lane between the crane's legs.
// The truck (Prompt 11) is placed so its trailer bed sits exactly here.
export const TRAILER_BED_HEIGHT = 1.45;
export const TRUCK_LOAD_POINT = new Vector3(44, QUAY_TOP + TRAILER_BED_HEIGHT, CRANE_POSITION.z);
