import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { SHIP, buildShipGeometry } from "./shipGeometry";

describe("buildShipGeometry", () => {
  const ship = buildShipGeometry();
  const hull = ship.hull;
  hull.computeBoundingBox();
  const size = hull.boundingBox!.getSize(new Vector3());

  it("builds a 140 × 22 m feeder hull, length on Z, beam on X", () => {
    expect(size.z).toBeCloseTo(140, 0);
    expect(size.x).toBeCloseTo(22, 0);
    expect(SHIP.length).toBe(140);
    expect(SHIP.beam).toBe(22);
  });

  it("draws 7–9 m below the waterline (y = 0)", () => {
    const draft = -hull.boundingBox!.min.y;
    expect(draft).toBeGreaterThanOrEqual(7);
    expect(draft).toBeLessThanOrEqual(9);
  });

  it("is centered on its origin across the beam and along the length", () => {
    expect(hull.boundingBox!.min.x + hull.boundingBox!.max.x).toBeCloseTo(0, 3);
    expect(hull.boundingBox!.min.z + hull.boundingBox!.max.z).toBeCloseTo(0, 3);
  });

  it("puts the hatch covers' top at the deck height containers rest on", () => {
    ship.hatches.computeBoundingBox();
    expect(ship.hatches.boundingBox!.max.y).toBeCloseTo(SHIP.hatchTop, 3);
  });

  it("stays inside its 35k-triangle budget (containers are counted with the stacks)", () => {
    const tris = Object.values(ship).reduce(
      (n, g) => n + (g.index ? g.index.count : g.attributes.position.count) / 3,
      0,
    );
    expect(tris).toBeLessThanOrEqual(35_000);
  });
});
