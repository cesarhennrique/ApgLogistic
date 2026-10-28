import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";

export type ContainerType = "20" | "40";

// ISO 668 outer dimensions, in meters (1 scene unit = 1 m).
export const CONTAINER: Record<ContainerType, { length: number; width: number; height: number }> = {
  "20": { length: 6.058, width: 2.438, height: 2.591 },
  "40": { length: 12.192, width: 2.438, height: 2.591 },
};

const POST = 0.17; // corner post, across the flats
const RAIL = 0.16; // top and bottom rail height
const PITCH = 0.6; // corrugation: one ridge and one valley; coarse on purpose, it reads at a distance
const WALL_OUT = 0.04; // ridge, in from the outer face
const WALL_IN = 0.1; // valley

// Triangle soup with flat normals: crisp facets suit the "cinematic miniature" look.
class Builder {
  positions: number[] = [];
  private n = new Vector3();
  private e1 = new Vector3();
  private e2 = new Vector3();

  // Quad a-b-c-d, wound so its face points along `outward`.
  quad(a: Vector3, b: Vector3, c: Vector3, d: Vector3, outward: Vector3) {
    this.e1.subVectors(b, a);
    this.e2.subVectors(c, a);
    const flip = this.n.crossVectors(this.e1, this.e2).dot(outward) < 0;
    const tris = flip ? [a, c, b, a, d, c] : [a, b, c, a, c, d];
    for (const v of tris) this.positions.push(v.x, v.y, v.z);
  }

  // Axis-aligned box from min to max; `skip` drops faces nothing ever sees.
  box(min: Vector3, max: Vector3, skip: string[] = []) {
    const [x0, y0, z0] = [min.x, min.y, min.z];
    const [x1, y1, z1] = [max.x, max.y, max.z];
    const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
    const faces: Record<string, [Vector3, Vector3, Vector3, Vector3, Vector3]> = {
      "+x": [v(x1, y0, z0), v(x1, y1, z0), v(x1, y1, z1), v(x1, y0, z1), v(1, 0, 0)],
      "-x": [v(x0, y0, z0), v(x0, y0, z1), v(x0, y1, z1), v(x0, y1, z0), v(-1, 0, 0)],
      "+y": [v(x0, y1, z0), v(x0, y1, z1), v(x1, y1, z1), v(x1, y1, z0), v(0, 1, 0)],
      "-y": [v(x0, y0, z0), v(x1, y0, z0), v(x1, y0, z1), v(x0, y0, z1), v(0, -1, 0)],
      "+z": [v(x0, y0, z1), v(x1, y0, z1), v(x1, y1, z1), v(x0, y1, z1), v(0, 0, 1)],
      "-z": [v(x0, y0, z0), v(x0, y1, z0), v(x1, y1, z0), v(x1, y0, z0), v(0, 0, -1)],
    };
    for (const [key, [a, b, c, d, out]] of Object.entries(faces)) if (!skip.includes(key)) this.quad(a, b, c, d, out);
  }

  // Chamfered square post: an octagon with its flats on the axes, open at the ends (rails cap it).
  post(cx: number, cz: number, y0: number, y1: number) {
    const r = POST / 2 / Math.cos(Math.PI / 8);
    for (let k = 0; k < 8; k++) {
      const a0 = Math.PI / 8 + (k * Math.PI) / 4;
      const a1 = a0 + Math.PI / 4;
      const p0 = [cx + r * Math.cos(a0), cz + r * Math.sin(a0)];
      const p1 = [cx + r * Math.cos(a1), cz + r * Math.sin(a1)];
      const mid = (a0 + a1) / 2;
      this.quad(
        new Vector3(p0[0], y0, p0[1]),
        new Vector3(p1[0], y0, p1[1]),
        new Vector3(p1[0], y1, p1[1]),
        new Vector3(p0[0], y1, p0[1]),
        new Vector3(Math.cos(mid), 0, Math.sin(mid)),
      );
    }
  }

  // One long side wall as a zig-zag profile, ridge and valley alternating every half pitch.
  corrugatedWall(side: 1 | -1, z0: number, z1: number, y0: number, y1: number, halfWidth: number) {
    const steps = Math.round((z1 - z0) / (PITCH / 2));
    const out = new Vector3(side, 0, 0);
    for (let i = 0; i < steps; i++) {
      const za = z0 + ((z1 - z0) * i) / steps;
      const zb = z0 + ((z1 - z0) * (i + 1)) / steps;
      const xa = side * (halfWidth - (i % 2 ? WALL_IN : WALL_OUT));
      const xb = side * (halfWidth - (i % 2 ? WALL_OUT : WALL_IN));
      this.quad(new Vector3(xa, y0, za), new Vector3(xb, y0, zb), new Vector3(xb, y1, zb), new Vector3(xa, y1, za), out);
    }
  }

  build() {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(this.positions, 3));
    g.computeVertexNormals();
    return g;
  }
}

function buildContainer({ length: L, width: W, height: H }: (typeof CONTAINER)[ContainerType]) {
  const b = new Builder();
  const hw = W / 2;
  const hl = L / 2;
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const inset = POST / 2;

  // Corner posts (cantoneiras), flush with the outer faces.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.post(sx * (hw - inset), sz * (hl - inset), 0, H);

  // Side rails, top and bottom, along the length; end rails across the top.
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? hw - 0.12 : -hw;
    const x1 = sx > 0 ? hw : -hw + 0.12;
    b.box(v(x0, 0, -hl + POST), v(x1, RAIL, hl - POST), ["-y", "+z", "-z"]);
    b.box(v(x0, H - RAIL, -hl + POST), v(x1, H, hl - POST), ["+z", "-z"]);
  }
  for (const sz of [-1, 1]) {
    const z0 = sz > 0 ? hl - 0.12 : -hl;
    const z1 = sz > 0 ? hl : -hl + 0.12;
    b.box(v(-hw + POST, H - RAIL, z0), v(hw - POST, H, z1), ["+x", "-x"]);
  }

  // Roof and floor.
  b.quad(v(-hw, H - 0.02, -hl), v(hw, H - 0.02, -hl), v(hw, H - 0.02, hl), v(-hw, H - 0.02, hl), v(0, 1, 0));
  b.quad(v(-hw, 0.02, -hl), v(hw, 0.02, -hl), v(hw, 0.02, hl), v(-hw, 0.02, hl), v(0, -1, 0));

  // Corrugated long sides.
  for (const side of [-1, 1] as const) b.corrugatedWall(side, -hl + POST, hl - POST, RAIL, H - RAIL, hw);

  // Front wall (-Z) and the doors (+Z), recessed between the posts, with four locking bars.
  const endIn = 0.05;
  b.quad(v(-hw, 0, -hl + endIn), v(hw, 0, -hl + endIn), v(hw, H, -hl + endIn), v(-hw, H, -hl + endIn), v(0, 0, -1));
  b.quad(v(-hw, 0, hl - endIn), v(hw, 0, hl - endIn), v(hw, H, hl - endIn), v(-hw, H, hl - endIn), v(0, 0, 1));
  for (const x of [-0.85, -0.35, 0.35, 0.85]) {
    b.box(v(x - 0.025, RAIL + 0.05, hl - endIn), v(x + 0.025, H - RAIL - 0.05, hl - endIn + 0.04), ["-z", "+y", "-y"]);
  }

  return b.build();
}

const cache = new Map<ContainerType, BufferGeometry>();

// One BufferGeometry per type, shared by every instance. Origin at the bottom center; length on Z.
export function getContainerGeometry(type: ContainerType): BufferGeometry {
  let g = cache.get(type);
  if (!g) {
    g = buildContainer(CONTAINER[type]);
    cache.set(type, g);
  }
  return g;
}

function buildStripe({ length: L, width: W, height: H }: (typeof CONTAINER)[ContainerType]) {
  const b = new Builder();
  const hl = L / 2 - POST;
  const [y0, y1] = [H * 0.58, H * 0.7];
  for (const side of [-1, 1]) {
    // Just proud of the ridges, inside the posts' outer face.
    const x = side * (W / 2 - WALL_OUT + 0.01);
    b.quad(new Vector3(x, y0, -hl), new Vector3(x, y0, hl), new Vector3(x, y1, hl), new Vector3(x, y1, -hl), new Vector3(side, 0, 0));
  }
  // Across both ends, between the posts and just in front of the door bars.
  const hw = W / 2 - POST;
  for (const side of [-1, 1]) {
    const z = side * (L / 2 - 0.005);
    b.quad(new Vector3(-hw, y0, z), new Vector3(hw, y0, z), new Vector3(hw, y1, z), new Vector3(-hw, y1, z), new Vector3(0, 0, side));
  }
  return b.build();
}

const stripeCache = new Map<ContainerType, BufferGeometry>();

// The APG red band: its own geometry, so it can be its own instanced mesh untouched by instance colors.
export function getStripeGeometry(type: ContainerType): BufferGeometry {
  let g = stripeCache.get(type);
  if (!g) {
    g = buildStripe(CONTAINER[type]);
    stripeCache.set(type, g);
  }
  return g;
}
