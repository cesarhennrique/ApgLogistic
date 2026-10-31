import { describe, expect, it } from "vitest";
import { DOCKS, PLAN, ROAD_WIDTH, STACKS, TARGET_DOCK, TRUCK_PATH_END, TRUCK_SIZE, WAREHOUSE } from "./terminalPlan";

describe("terminal plan", () => {
  it("numbers 46 docks, 01 to 46, round the warehouse's west, south and east faces, each wider than the truck", () => {
    expect(DOCKS).toHaveLength(46);
    expect(DOCKS.map((d) => d.n)).toEqual(Array.from({ length: 46 }, (_, i) => i + 1));
    for (const d of DOCKS) {
      const onWest = Math.abs(d.x + d.w - WAREHOUSE.x) < 1e-6;
      const onSouth = Math.abs(d.y - (WAREHOUSE.y + WAREHOUSE.h)) < 1e-6;
      const onEast = Math.abs(d.x - (WAREHOUSE.x + WAREHOUSE.w)) < 1e-6;
      expect(onWest || onSouth || onEast).toBe(true);
      expect(Math.max(d.w, d.h)).toBeGreaterThan(TRUCK_SIZE.width);
    }
  });

  it("splits the 4,000 TEUs over the stack blocks, inside the yard", () => {
    expect(STACKS.reduce((n, b) => n + b.teus, 0)).toBe(4000);
    for (const b of STACKS) {
      expect(b.x).toBeGreaterThan(PLAN.yard.x0);
      expect(b.x + b.w).toBeLessThan(PLAN.yard.x1);
    }
  });

  it("parks the truck nose-in at the target dock, the truck as wide as a lane", () => {
    const dock = DOCKS[TARGET_DOCK - 1];
    expect(TRUCK_PATH_END.x).toBeCloseTo(dock.x + dock.w / 2, 6);
    // its nose at the dock's outer edge
    expect(TRUCK_PATH_END.y - TRUCK_SIZE.length / 2).toBeCloseTo(dock.y + dock.h, 6);
    expect(TRUCK_SIZE.width).toBeCloseTo(ROAD_WIDTH / 2, 6);
  });
});
