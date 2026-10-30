import { BoxGeometry, type BufferGeometry, Matrix4, Quaternion, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Ship-to-shore crane, in its own frame: origin on the quay between the legs, boom along X (sea at -X).
// Real STS proportions, simplified to clean members: 30 m between the rails, main girder 45 m up, 55 m of boom
// over the water past the sea-side legs, 20 m of backreach over the quay, A-frame apex ~70 m.
export const CRANE = {
  legX: 15,
  legZ: 9,
  portalY: 42,
  boomY: 45,
  boomZ: 3,
  boomFrom: -70,
  boomTo: 35,
  apexY: 70,
  // Trolley rails, under the main girders.
  trolleyY: 43.4,
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
      s.push(beam(v(x, 0.9, z), v(x, portalY, z), 1.6));
      // Gantry bogie on the rail.
      s.push(block(v(x - 1.4, 0, z - 2.6), v(x + 1.4, 0.9, z + 2.6)));
    }
    // Across the rails (along Z): portal beam on top and a sill beam, nothing in between: the box travels
    // through these frames along the boom.
    s.push(beam(v(x, portalY, -legZ), v(x, portalY, legZ), 1.4));
    s.push(beam(v(x, 12, -legZ), v(x, 12, legZ), 0.9));
  }
  for (const z of [-legZ, legZ]) {
    // Along each rail: portal and sill beams, and the knee braces that give the STS its stance.
    s.push(beam(v(-legX, portalY, z), v(legX, portalY, z), 1.4));
    s.push(beam(v(-legX, 12, z), v(legX, 12, z), 0.9));
    for (const x of [-legX, legX]) s.push(beam(v(x, portalY - 12, z), v(x * 0.45, portalY, z), 0.8));
    // Up to the main girders.
    for (const x of [-legX, legX]) s.push(beam(v(x, portalY, z), v(x, boomY - 1.2, Math.sign(z) * boomZ), 1.0));
  }
  // Main girders, sea tip to backreach, tied across every 7 m.
  for (const z of [-boomZ, boomZ]) s.push(beam(v(boomFrom, boomY, z), v(boomTo, boomY, z), 1.2, 2.4));
  for (let x = boomFrom + 1; x <= boomTo - 1; x += 7) s.push(beam(v(x, boomY + 1, -boomZ), v(x, boomY + 1, boomZ), 0.4));
  // A-frame: sea and land struts per side meeting at the apex, then the stays.
  for (const z of [-6, 6]) {
    const apex = v(-4, apexY, Math.sign(z) * 3);
    s.push(beam(v(-legX, boomY + 1.2, z * 0.6), apex, 1.1));
    s.push(beam(v(legX, boomY + 1.2, z * 0.6), apex, 1.1));
    const bz = Math.sign(z) * boomZ;
    // Forestays to the boom tip and its middle; backstay to the backreach.
    s.push(beam(apex, v(boomFrom + 1.5, boomY + 1.2, bz), 0.32));
    s.push(beam(apex, v((boomFrom - legX) / 2, boomY + 1.2, bz), 0.32));
    s.push(beam(apex, v(boomTo - 2, boomY + 1.2, bz), 0.32));
  }
  s.push(beam(v(-4, apexY, -3.4), v(-4, apexY, 3.4), 0.9));

  // Machinery house on the backreach, and the boom-tip head.
  const house = [
    block(v(18, boomY + 1.2, -4.2), v(32, boomY + 6.4, 4.2)),
    block(v(18.4, boomY + 6.4, -3.8), v(31.6, boomY + 6.9, 3.8)),
    block(v(boomFrom, boomY - 1.4, -boomZ - 0.7), v(boomFrom + 2.5, boomY + 1.6, boomZ + 0.7)),
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
