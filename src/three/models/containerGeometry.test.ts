import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { CONTAINER, type ContainerType, getContainerGeometry, getStripeGeometry } from "./containerGeometry";

function measure(type: ContainerType) {
  const g = getContainerGeometry(type);
  g.computeBoundingBox();
  return { box: g.boundingBox!, size: g.boundingBox!.getSize(new Vector3()) };
}

// Vertices on the long side walls (between the corner posts' inner face and the outer edge).
function sideWall(type: ContainerType) {
  const pos = getContainerGeometry(type).attributes.position;
  const out: { x: number; z: number }[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = Math.abs(pos.getX(i));
    if (x > 1.0 && x < 1.2 && Math.abs(pos.getZ(i)) < CONTAINER[type].length / 2 - 0.2) out.push({ x, z: pos.getZ(i) });
  }
  return out;
}

describe("getContainerGeometry", () => {
  it("builds a 20' at 6.06 × 2.44 × 2.59 (length on Z, width on X, height on Y)", () => {
    const { size } = measure("20");
    expect(size.z).toBeCloseTo(6.06, 2);
    expect(size.x).toBeCloseTo(2.44, 2);
    expect(size.y).toBeCloseTo(2.59, 2);
  });

  it("builds a 40' at 12.19 × 2.44 × 2.59", () => {
    const { size } = measure("40");
    expect(size.z).toBeCloseTo(12.19, 2);
    expect(size.x).toBeCloseTo(2.44, 2);
    expect(size.y).toBeCloseTo(2.59, 2);
  });

  it("keeps the real 40' to 20' proportion", () => {
    expect(measure("40").size.z / measure("20").size.z).toBeCloseTo(12.19 / 6.06, 2);
  });

  it("puts the origin at the bottom center, so an instance's position is where it rests", () => {
    for (const type of ["20", "40"] as const) {
      const { box } = measure(type);
      expect(box.min.y).toBeCloseTo(0, 6);
      expect(box.min.x + box.max.x).toBeCloseTo(0, 6);
      expect(box.min.z + box.max.z).toBeCloseTo(0, 6);
    }
  });

  it("returns one memoized geometry per type", () => {
    expect(getContainerGeometry("20")).toBe(getContainerGeometry("20"));
    expect(getContainerGeometry("40")).not.toBe(getContainerGeometry("20"));
  });

  it("corrugates the long sides in geometry: ridges at two depths all along the wall", () => {
    const wall = sideWall("40");
    expect(new Set(wall.map((v) => v.x.toFixed(3))).size).toBeGreaterThanOrEqual(2);
    expect(new Set(wall.map((v) => v.z.toFixed(2))).size).toBeGreaterThan(30);
  });

  it("gives the APG stripe its own geometry: a band on both long sides, just proud of the ridges", () => {
    for (const type of ["20", "40"] as const) {
      const g = getStripeGeometry(type);
      g.computeBoundingBox();
      const { min, max } = g.boundingBox!;
      const { width, length, height } = CONTAINER[type];
      expect(max.x).toBeLessThanOrEqual(width / 2);
      expect(max.x).toBeGreaterThan(width / 2 - 0.04);
      expect(min.x).toBeCloseTo(-max.x, 6);
      expect(max.z - min.z).toBeGreaterThan(length * 0.8);
      expect(min.y).toBeGreaterThan(height * 0.4);
      expect(max.y).toBeLessThan(height * 0.85);
      expect(getStripeGeometry(type)).toBe(g);
    }
  });

  it("wraps the APG stripe across both ends too, so it reads end-on from the crane shots", () => {
    for (const type of ["20", "40"] as const) {
      const pos = getStripeGeometry(type).attributes.position;
      const hl = CONTAINER[type].length / 2;
      const zs = Array.from({ length: pos.count }, (_, i) => pos.getZ(i));
      expect(zs.some((z) => z > hl - 0.06 && z <= hl)).toBe(true);
      expect(zs.some((z) => z < -hl + 0.06 && z >= -hl)).toBe(true);
    }
  });

  it("stays inside the triangle budget (up to 400 instances share 120k with the rest)", () => {
    const tris = (type: ContainerType) => getContainerGeometry(type).attributes.position.count / 3;
    expect(tris("20")).toBeLessThanOrEqual(260);
    expect(tris("40")).toBeLessThanOrEqual(340);
  });
});
