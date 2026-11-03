import { describe, expect, it } from "vitest";
import { CONE_AT, sampleDistributionCamera } from "./distributionCamera";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
// PE and BA, roughly, in map units
const bounds = { minX: -60, maxX: 2, minZ: -5, maxZ: 48 };

describe("the distribution's camera", () => {
  it("opens close on the CONE terminal's point, where scene 4 left the dock", () => {
    for (const view of [desktop, phone]) {
      const cam = sampleDistributionCamera(0, view, bounds);
      expect(cam.origin.x).toBeCloseTo(CONE_AT(view).x);
      expect(cam.origin.y).toBeCloseTo(CONE_AT(view).y);
    }
  });

  it("pulls back to fit PE and BA in its region, only ever pulling back", () => {
    for (const view of [desktop, phone]) {
      let last = Infinity;
      for (let t = 0; t <= 1; t += 0.05) {
        const { scale } = sampleDistributionCamera(t, view, bounds);
        expect(scale).toBeLessThanOrEqual(last + 1e-9);
        last = scale;
      }
      const end = sampleDistributionCamera(1, view, bounds);
      const left = end.origin.x + bounds.minX * end.scale;
      const right = end.origin.x + bounds.maxX * end.scale;
      const top = end.origin.y + bounds.minZ * end.scale;
      const bottom = end.origin.y + bounds.maxZ * end.scale;
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(view.width);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(bottom).toBeLessThanOrEqual(view.height);
    }
  });
});
