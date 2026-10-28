import { BoxGeometry, type BufferGeometry, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Ship-to-shore crane, in its own frame: origin on the quay between the legs, boom along X (sea at -X).
// Proportions of a mid-size STS crane, simplified: legs 16 m apart, boom 28 m up, 30 m outreach.
export const CRANE = {
  legX: 8,
  legZ: 8,
  portalY: 26,
  boomY: 28,
  boomZ: 2.6,
  boomFrom: -30,
  boomTo: 24,
  apexY: 46,
  // Trolley rails, under the boom girders.
  trolleyY: 27.2,
};

const Z = new Vector3(0, 0, 1);
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// A square-section member from a to b.
export function beam(a: Vector3, b: Vector3, w: number, h = w): BufferGeometry {
  const dir = new Vector3().subVectors(b, a);
  const g = new BoxGeometry(w, h, dir.length());
  const q = new Quaternion().setFromUnitVectors(Z, dir.clone().normalize());
  return g.applyMatrix4(new Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new Vector3(1, 1, 1)));
}

export function block(min: Vector3, max: Vector3): BufferGeometry {
  const size = new Vector3().subVectors(max, min);
  const center = new Vector3().addVectors(min, max).multiplyScalar(0.5);
  return new BoxGeometry(size.x, size.y, size.z).translate(center.x, center.y, center.z);
}

export function buildCraneGeometry() {
  const { legX, legZ, portalY, boomY, boomZ, boomFrom, boomTo, apexY } = CRANE;
  const s: BufferGeometry[] = [];

  for (const x of [-legX, legX]) {
    for (const z of [-legZ, legZ]) {
      s.push(beam(v(x, 0.9, z), v(x, portalY, z), 1.1));
      // Gantry bogie on the rail.
      s.push(block(v(x - 1.2, 0, z - 2.2), v(x + 1.2, 0.9, z + 2.2)));
    }
    // Side frame: cross beams along Z only. No braces: the box travels through these frames along the boom.
    s.push(beam(v(x, portalY, -legZ), v(x, portalY, legZ), 0.9));
    s.push(beam(v(x, 12, -legZ), v(x, 12, legZ), 0.7));
  }
  for (const z of [-legZ, legZ]) {
    s.push(beam(v(-legX, portalY, z), v(legX, portalY, z), 0.9));
    s.push(beam(v(-legX, 12, z), v(legX, 12, z), 0.7));
  }
  // Boom: twin girders on the portal, cross ties, and a light truss on top.
  for (const z of [-boomZ, boomZ]) {
    s.push(beam(v(boomFrom, boomY, z), v(boomTo, boomY, z), 0.9, 1.6));
    for (const x of [-legX, legX]) s.push(beam(v(x, portalY, z), v(x, boomY - 0.8, z), 0.6));
    s.push(beam(v(boomFrom + 4, boomY + 3, z), v(boomTo - 4, boomY + 3, z), 0.35));
    for (let x = boomFrom + 4; x < boomTo - 4; x += 4) {
      s.push(beam(v(x, boomY + 0.8, z), v(x + 4, boomY + 3, z), 0.22));
      s.push(beam(v(x + 4, boomY + 0.8, z), v(x + 4, boomY + 3, z), 0.22));
    }
  }
  for (let x = boomFrom + 1; x <= boomTo - 1; x += 6) s.push(beam(v(x, boomY + 0.6, -boomZ), v(x, boomY + 0.6, boomZ), 0.3));
  // A-frame and its stays to the boom.
  for (const z of [-4.5, 4.5]) {
    const apex = v(0, apexY, z * 0.6);
    s.push(beam(v(-legX, portalY, z), apex, 0.8));
    s.push(beam(v(legX, portalY, z), apex, 0.8));
    const bz = Math.sign(z) * boomZ;
    for (const x of [-14, boomFrom + 2]) s.push(beam(apex, v(x, boomY + 3, bz), 0.25));
    s.push(beam(apex, v(boomTo - 2, boomY + 3, bz), 0.25));
  }
  s.push(beam(v(0, apexY, -2.7), v(0, apexY, 2.7), 0.7));

  const house = [
    block(v(12, boomY + 0.8, -3.6), v(22, boomY + 4.6, 3.6)),
    block(v(12.4, boomY + 4.6, -3.2), v(21.6, boomY + 5, 3.2)),
  ];

  return { structure: mergeGeometries(s)!, house: mergeGeometries(house)! };
}

export function buildTrolleyGeometry() {
  return mergeGeometries([
    // Carriage under the girders.
    block(v(-2.2, -0.7, -3), v(2.2, 0.7, 3)),
    // Operator cab on the sea side, hanging below.
    block(v(-3.6, -2.8, -1.1), v(-1.4, -0.7, 1.1)),
  ])!;
}

// Spreader: the frame that grips the box from above; origin at its bottom center, long along Z.
export function buildSpreaderGeometry(length: number) {
  const hl = length / 2;
  return mergeGeometries([
    block(v(-1.15, 0, -hl), v(-0.85, 0.4, hl)),
    block(v(0.85, 0, -hl), v(1.15, 0.4, hl)),
    block(v(-1.15, 0, -hl), v(1.15, 0.4, -hl + 0.3)),
    block(v(-1.15, 0, hl - 0.3), v(1.15, 0.4, hl)),
    // Headblock, where the hoist ropes meet.
    block(v(-1.0, 0.4, -1.3), v(1.0, 0.9, 1.3)),
  ])!;
}
