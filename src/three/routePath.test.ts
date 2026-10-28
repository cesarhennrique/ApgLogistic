import { describe, expect, it } from "vitest";
import { TRUCK_LOAD_POINT } from "./anchors";
import { HIGHWAY } from "./models/highwayLayout";
import { ROUTE_CURVE, ROUTE_LENGTH, ROUTE_KNOTS, revealAt } from "./routePath";

describe("the route line", () => {
  it("starts at the port, in the crane's truck lane", () => {
    expect(ROUTE_CURVE.getPoint(0).distanceTo(TRUCK_LOAD_POINT)).toBeLessThan(2);
  });

  it("runs along the highway on the truck's lane", () => {
    const onRoad = ROUTE_KNOTS.filter((k) => Math.abs(k.point.z - HIGHWAY.truckLaneZ) < 0.5);
    expect(onRoad.length).toBeGreaterThanOrEqual(2);
  });

  it("is hidden at the very start and fully drawn at the end", () => {
    expect(revealAt(0)).toBe(0);
    expect(revealAt(1)).toBeCloseTo(ROUTE_LENGTH, 3);
  });

  it("only ever grows with progress, without sudden jumps", () => {
    let last = 0;
    for (let p = 0; p <= 1; p += 0.001) {
      const r = revealAt(p);
      expect(r).toBeGreaterThanOrEqual(last - 1e-9);
      expect(r - last).toBeLessThan(ROUTE_LENGTH * 0.02);
      last = r;
    }
  });

  it("reaches each scene at its chapter's progress", () => {
    for (const k of ROUTE_KNOTS) expect(revealAt(k.progress)).toBeCloseTo(k.length, 1);
  });
});
