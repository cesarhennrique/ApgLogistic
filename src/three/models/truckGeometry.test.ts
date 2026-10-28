import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { TRUCK_LOAD_POINT } from "../anchors";
import { craneState } from "../craneMotion";
import { CONTAINER } from "./containerGeometry";
import { TRAILER, TWIST_LOCKS, buildTruckGeometry } from "./truckGeometry";

describe("buildTruckGeometry", () => {
  const truck = buildTruckGeometry();

  it("gives the skeletal trailer room for a 40' (≥ 12.19 m of bed)", () => {
    expect(TRAILER.bedLength).toBeGreaterThanOrEqual(12.19);
    truck.trailer.computeBoundingBox();
    expect(truck.trailer.boundingBox!.getSize(new Vector3()).z).toBeGreaterThanOrEqual(12.19);
  });

  it("puts the bed top at the trailer's origin (y = 0), so TRUCK_LOAD_POINT is where the box rests", () => {
    truck.trailer.computeBoundingBox();
    expect(truck.trailer.boundingBox!.max.y).toBeCloseTo(0, 2);
  });

  it("stays inside its 20k-triangle budget", () => {
    const tris = Object.values(truck).reduce(
      (n, g) => n + (g.index ? g.index.count : g.attributes.position.count) / 3,
      0,
    );
    expect(tris).toBeLessThanOrEqual(20_000);
  });
});

describe("the crane's box on the trailer", () => {
  it("comes to rest within 2 cm of TRUCK_LOAD_POINT at the end of 'load'", () => {
    expect(craneState(0.4).container.distanceTo(TRUCK_LOAD_POINT)).toBeLessThan(0.02);
  });

  it("sits its four corner castings on the four twist locks (within 2 cm)", () => {
    const { length, width } = CONTAINER["40"];
    const box = craneState(0.4).container;
    // Corner castings: centered on the corner posts, 0.085 m in from each face.
    const castings = [-1, 1].flatMap((sx) =>
      [-1, 1].map((sz) => new Vector3(box.x + sx * (width / 2 - 0.085), box.y, box.z + sz * (length / 2 - 0.085))),
    );
    expect(TWIST_LOCKS).toHaveLength(4);
    for (const lock of TWIST_LOCKS) {
      const world = lock.clone().add(TRUCK_LOAD_POINT);
      const nearest = Math.min(...castings.map((c) => c.distanceTo(world)));
      expect(nearest).toBeLessThan(0.02);
    }
  });
});
