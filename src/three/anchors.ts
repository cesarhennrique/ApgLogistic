import { Vector3 } from "three";

// World layout of the port, in meters (1 scene unit = 1 m). Containers lie along Z, the crane's boom along X
// (sea to -X, land to +X), the quay edge runs along Z at QUAY_EDGE_X.

export const QUAY_TOP = 1.2;
export const QUAY_EDGE_X = 32;

// Crane base: center between its four legs, on the quay.
// Off to the right of the hero's view, so from the hero it's a silhouette on the horizon, not a wall.
export const CRANE_POSITION = new Vector3(40, QUAY_TOP, -56);

// Ship's deck bay the crane works: bottom-center of the container it picks. The GLB hull (Prompt 11)
// must put its deck under this point.
export const SHIP_DECK_Y = 1.4;
export const SHIP_PICK_POINT = new Vector3(26, SHIP_DECK_Y + 2.59, -56);

// Bottom-center of the container once it rests on the APG trailer, in the lane between the crane's legs.
// The truck (Prompt 11) is placed so its trailer bed sits exactly here.
export const TRAILER_BED_HEIGHT = 1.45;
export const TRUCK_LOAD_POINT = new Vector3(42, QUAY_TOP + TRAILER_BED_HEIGHT, -56);
