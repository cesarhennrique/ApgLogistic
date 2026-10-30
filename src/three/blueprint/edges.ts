import { type BufferGeometry, EdgesGeometry, type Matrix4, Vector3 } from "three";

// The drawing's line work: a geometry's creases (faces meeting at 20° or more, so no triangle diagonals and no
// facets of a round), as flat segment pairs [ax, ay, az, bx, by, bz, …], ordered bottom-up so a reveal builds the
// object from the ground.
export function edgeSegments(geometry: BufferGeometry, thresholdDeg = 20): Float32Array {
  const edges = new EdgesGeometry(geometry, thresholdDeg);
  const flat = edges.getAttribute("position").array as Float32Array;
  edges.dispose();
  return sortBottomUp(flat);
}

function sortBottomUp(flat: Float32Array): Float32Array {
  const count = flat.length / 6;
  const order = Array.from({ length: count }, (_, i) => i);
  const low = (i: number) => Math.min(flat[i * 6 + 1], flat[i * 6 + 4]);
  order.sort((a, b) => low(a) - low(b) || flat[a * 6] - flat[b * 6]);
  const out = new Float32Array(flat.length);
  order.forEach((from, to) => out.set(flat.subarray(from * 6, from * 6 + 6), to * 6));
  return out;
}

const a = new Vector3();
const b = new Vector3();

// The same segments once per instance, moved by its matrix, then reordered bottom-up as a whole.
export function instanceSegments(base: Float32Array, matrices: Matrix4[]): Float32Array {
  const out = new Float32Array(base.length * matrices.length);
  matrices.forEach((m, k) => {
    for (let i = 0; i < base.length; i += 6) {
      a.fromArray(base, i).applyMatrix4(m).toArray(out, k * base.length + i);
      b.fromArray(base, i + 3).applyMatrix4(m).toArray(out, k * base.length + i + 3);
    }
  });
  return sortBottomUp(out);
}

// Each segment's start and end distance along the drawing order [start0, end0, start1, end1, …]: the dash that
// reveals the drawing slides along this.
export function cumulativeLengths(flat: Float32Array): Float32Array {
  const out = new Float32Array((flat.length / 6) * 2);
  let total = 0;
  for (let i = 0, j = 0; i < flat.length; i += 6, j += 2) {
    out[j] = total;
    total += Math.hypot(flat[i + 3] - flat[i], flat[i + 4] - flat[i + 1], flat[i + 5] - flat[i + 2]);
    out[j + 1] = total;
  }
  return out;
}
