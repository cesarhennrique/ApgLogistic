import { type BufferGeometry, CylinderGeometry, ExtrudeGeometry, Shape, ShapeGeometry, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TRAILER_BED_HEIGHT } from "../anchors";
import { CONTAINER } from "./containerGeometry";
import { beam, block } from "./craneGeometry";

// European cab-over 6x2 tractor (no make) and a 40' skeletal container trailer, in the truck's own frame:
// origin at the trailer bed's top center (where TRUCK_LOAD_POINT puts the box), cab facing +Z.
const G = -TRAILER_BED_HEIGHT; // ground

const { length: L, width: W } = CONTAINER["40"];

export const TRAILER = { front: 6.15, rear: -6.15, bedLength: 12.3 };

// Twist locks under the box's four corner castings (0.085 m in from each face, on the bed's top).
export const TWIST_LOCKS = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => new Vector3(sx * (W / 2 - 0.085), 0, sz * (L / 2 - 0.085))));

// Tire centers (x, z): steer axle, dual drive axle, tag axle, the trailer's three axles. 22.5" tires (~1.04 m).
export const TIRE_RADIUS = 0.52;
const STEER_Z = 8.4;
const DRIVE_Z = 4.7;
const TAG_Z = 3.4;
const TRAILER_AXLES = [-3.2, -4.5, -5.8];
export const WHEELS: [number, number][] = [
  ...[-1.05, 1.05].map((x) => [x, STEER_Z] as [number, number]),
  ...[-1.1, -0.78, 0.78, 1.1].map((x) => [x, DRIVE_Z] as [number, number]),
  ...[-1.05, 1.05].map((x) => [x, TAG_Z] as [number, number]),
  ...TRAILER_AXLES.flatMap((z) => [-1.05, 1.05].map((x) => [x, z] as [number, number])),
];
export const WHEEL_Y = G + TIRE_RADIUS;
export const GROUND_Y = G;

// Headlamp centers, for the spotlights and their fake volumetric cones.
export const HEADLIGHTS = [-0.85, 0.85].map((x) => new Vector3(x, G + 0.78, 9.98));

// The cab shell, also the decal's target (the APG logo on the doors, between the band and the window).
export const CAB = { z0: 7.55, z1: 9.75, y0: G + 1.25, y1: G + 3.95, halfWidth: 1.25 };

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// Segments of a round: 15° apart, under the drawing's 20° crease angle, so only its rims are drawn.
const ROUND = 24;

// The logo's red arrow, running forward along the navy band on a cab side (just proud of the band).
function arrow(side: 1 | -1) {
  const y = (h: number) => G + h;
  // Shape space: u along the length (negated on the right side so it still points forward), v up.
  const u = (z: number) => (side > 0 ? -z : z);
  const shape = new Shape();
  shape.moveTo(u(7.7), y(1.5));
  shape.lineTo(u(9.05), y(1.5));
  shape.lineTo(u(9.05), y(1.38));
  shape.lineTo(u(9.5), y(1.575));
  shape.lineTo(u(9.05), y(1.77));
  shape.lineTo(u(9.05), y(1.65));
  shape.lineTo(u(7.7), y(1.65));
  shape.closePath();
  return new ShapeGeometry(shape).rotateY((side * Math.PI) / 2).translate(side * (CAB.halfWidth + 0.022), 0, 0);
}

// Roof deflector: a side profile swept across the cab's width.
function deflector() {
  const roof = CAB.y1;
  const shape = new Shape();
  shape.moveTo(CAB.z0 + 0.1, roof - 0.05);
  shape.lineTo(CAB.z1 - 0.55, roof - 0.05);
  shape.lineTo(CAB.z0 + 0.55, roof + 0.85);
  shape.lineTo(CAB.z0 + 0.1, roof + 0.9);
  shape.closePath();
  return new ExtrudeGeometry(shape, { depth: 2.3, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(1.15, 0, 0);
}

// Arched mudguard over a wheel: half a cylinder shell across the tire.
function arch(x: number, z: number, width: number) {
  return new CylinderGeometry(0.64, 0.64, width, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).translate(x, WHEEL_Y, z);
}

export function buildTruckGeometry() {
  // A plain box: rounded edges would draw as bundles of parallel lines.
  const cab = block(v(-CAB.halfWidth, CAB.y0, CAB.z0), v(CAB.halfWidth, CAB.y1, CAB.z1));
  const sides = [-1, 1] as const;

  const paint = mergeGeometries([
    ...sides.map((s) => block(v(s * 1.2 - (s > 0 ? 0 : 0.05), G + 0.45, 5.4), v(s * 1.2 + (s > 0 ? 0.05 : 0), G + 1.0, 6.2))), // side skirts
    ...[0.12, 0.32, 0.52].map((h) => block(v(-0.82, G + 1.3 + h, 9.78), v(0.82, G + 1.36 + h, 9.82))), // grille slats
  ])!;
  const navy = mergeGeometries([
    ...sides.map((s) => block(v(s > 0 ? 1.25 : -1.27, G + 1.3, 7.75), v(s > 0 ? 1.27 : -1.25, G + 1.85, 9.6))),
    block(v(-1.0, G + 1.3, 9.75), v(1.0, G + 1.42, 9.79)),
  ])!;
  const red = mergeGeometries(sides.map(arrow))!;
  const dark = mergeGeometries([
    block(v(-0.85, G + 1.25, 9.75), v(0.85, G + 2.0, 9.79)), // grille
    block(v(-1.27, G + 0.55, 9.5), v(1.27, G + 1.0, 9.95)), // bumper
    block(v(-1.22, G + 3.62, 9.62), v(1.22, G + 3.76, 10.05)), // sun visor
    ...sides.map((s) => beam(v(s * 0.45, G + 0.75, 2.6), v(s * 0.45, G + 0.75, 9.5), 0.2, 0.3)), // chassis rails
    block(v(-0.9, G + 1.0, 4.55), v(0.9, G + 1.1, 5.75)), // fifth wheel
    ...sides.flatMap((s) => [
      beam(v(s * 1.25, G + 3.3, 9.4), v(s * 1.52, G + 3.3, 9.5), 0.06), // mirror arm
      block(v(s > 0 ? 1.46 : -1.62, G + 2.7, 9.36), v(s > 0 ? 1.62 : -1.46, G + 3.45, 9.5)), // mirror
      // Door steps.
      ...[0.55, 0.95].map((h) => block(v(s > 0 ? 1.12 : -1.3, G + h, 8.55), v(s > 0 ? 1.3 : -1.12, G + h + 0.06, 9.2))),
      // Arched mudguards: steer axle, then drive and tag.
      arch(s * 1.05, STEER_Z, 0.42),
      arch(s * 0.94, DRIVE_Z, 0.72),
      arch(s * 1.05, TAG_Z, 0.42),
    ]),
  ])!;
  const metal = mergeGeometries(
    sides.map((s) => new CylinderGeometry(0.32, 0.32, 1.3, ROUND).rotateX(Math.PI / 2).translate(s * 0.95, G + 0.72, 6.9)),
  )!; // fuel tanks
  const glass = mergeGeometries([
    block(v(-1.08, G + 2.45, 9.75), v(1.08, G + 3.52, 9.79)),
    ...sides.map((s) => block(v(s > 0 ? 1.25 : -1.29, G + 2.6, 8.3), v(s > 0 ? 1.29 : -1.25, G + 3.4, 9.45))),
  ])!;
  const headlights = mergeGeometries(HEADLIGHTS.map((h) => block(v(h.x - 0.2, h.y - 0.08, 9.94), v(h.x + 0.2, h.y + 0.08, 9.98))))!;
  const amber = mergeGeometries([
    ...sides.map((s) => block(v(s * 1.08 - 0.06, G + 3.95, 9.5), v(s * 1.08 + 0.06, G + 4.03, 9.7))), // roof markers
    ...sides.map((s) => block(v(s > 0 ? 1.25 : -1.27, G + 0.6, 5.7), v(s > 0 ? 1.27 : -1.25, G + 0.7, 5.9))), // side markers
  ])!;

  // Skeletal trailer: longerons, bolsters at both ends (the box rests there), the gooseneck plate on the
  // fifth wheel, axles, landing gear, bumper, and the twist locks.
  const trailer = mergeGeometries([
    ...sides.map((s) => beam(v(s * 0.5, -0.31, TRAILER.rear), v(s * 0.5, -0.31, TRAILER.front), 0.16, 0.38)),
    ...[TRAILER.front - 0.1, TRAILER.rear + 0.1].map((z) => block(v(-W / 2, -0.2, z - 0.1), v(W / 2, -0.06, z + 0.1))),
    ...[-2.2, 2.2].map((z) => block(v(-1.1, -0.32, z - 0.08), v(1.1, -0.14, z + 0.08))),
    block(v(-0.6, -0.42, 4.3), v(0.6, -0.2, TRAILER.front)),
    ...TRAILER_AXLES.map((z) => beam(v(-1.15, WHEEL_Y, z), v(1.15, WHEEL_Y, z), 0.14)),
    ...sides.map((s) => beam(v(s * 0.9, G + 0.3, 4.0), v(s * 0.9, -0.4, 4.0), 0.12)),
    block(v(-1.2, G + 0.45, TRAILER.rear - 0.12), v(1.2, G + 0.6, TRAILER.rear)),
    ...TWIST_LOCKS.map((t) => block(v(t.x - 0.08, -0.06, t.z - 0.08), v(t.x + 0.08, 0, t.z + 0.08))),
  ])!;

  const tire = new CylinderGeometry(TIRE_RADIUS, TIRE_RADIUS, 0.3, ROUND).rotateZ(Math.PI / 2);
  const rim = new CylinderGeometry(0.29, 0.29, 0.31, ROUND).rotateZ(Math.PI / 2);

  return { cab, deflector: deflector(), paint, navy, red, dark, metal, glass, headlights, amber, trailer, tire, rim } satisfies Record<
    string,
    BufferGeometry
  >;
}
