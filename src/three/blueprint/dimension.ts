import { Vector3 } from "three";

export type Vec3 = [number, number, number];

const GAP = 0.6;
const OVERSHOOT = 1.2;
const TICK = 0.9;

// A technical dimension's line work (flat segment pairs, in drawing order): two extension lines from the measured
// points out past the dimension line (a small gap at the object), the dimension line itself at `offset`, and a
// 45° tick at each end.
export function dimensionSegments(from: Vec3, to: Vec3, offset: Vec3): Float32Array {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const o = new Vector3(...offset);
  const out = o.clone().normalize();
  const along = b.clone().sub(a).normalize();
  const a2 = a.clone().add(o);
  const b2 = b.clone().add(o);
  const ext = (p: Vector3, q: Vector3) => [...p.clone().addScaledVector(out, GAP).toArray(), ...q.clone().addScaledVector(out, OVERSHOOT).toArray()];
  const tickDir = along.clone().add(out).normalize().multiplyScalar(TICK / 2);
  const tick = (p: Vector3) => [...p.clone().sub(tickDir).toArray(), ...p.clone().add(tickDir).toArray()];
  return new Float32Array([...ext(a, a2), ...ext(b, b2), ...a2.toArray(), ...b2.toArray(), ...tick(a2), ...tick(b2)]);
}
