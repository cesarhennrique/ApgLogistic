import { describe, expect, it } from "vitest";
import { toScreen } from "./oceanCamera";
import { CRANE_BOUNDS, SPREADER } from "./craneAnchors";
import { CLOSE_SHARE, ZOOM, containerCentre, frameRegion, sampleCraneCamera } from "./craneCamera";

const desktop = { width: 1440, height: 900, dpr: 1 };
const retina = { width: 1440, height: 900, dpr: 2 };
const phone = { width: 390, height: 664, dpr: 3 };

describe("craneCamera", () => {
  it("opens on a close of the container: ~45% of the screen's width, at its centre", () => {
    const cam = sampleCraneCamera(0, desktop, 1600);
    expect(SPREADER.w * cam.scale).toBeCloseTo(CLOSE_SHARE * 1440, 3);
    const c = toScreen(cam, containerCentre(1600));
    expect(c.x).toBeCloseTo(720, 3);
    expect(c.y).toBeCloseTo(450, 3);
  });

  it("never magnifies a pixel of the crane image past 1.5 device pixels", () => {
    for (const view of [desktop, retina, phone]) {
      expect(sampleCraneCamera(0, view, 1600).scale * view.dpr).toBeLessThanOrEqual(1.5 + 1e-9);
    }
  });

  it("pulls back exponentially: equal steps of progress divide the scale by the same ratio", () => {
    const steps = [0.1, 0.25, 0.4, 0.55, 0.7].map((p) => sampleCraneCamera(p, desktop, 0).scale);
    const ratios = steps.slice(1).map((s, i) => s / steps[i]);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 9);
    expect(ratios[0]).toBeLessThan(1);
  });

  it("ends on the whole crane, fitted to its region of the screen", () => {
    for (const view of [desktop, phone]) {
      const cam = sampleCraneCamera(ZOOM[1], view, 0);
      const region = frameRegion(view);
      const a = toScreen(cam, { x: CRANE_BOUNDS.x0, y: CRANE_BOUNDS.y0 });
      const b = toScreen(cam, { x: CRANE_BOUNDS.x1, y: CRANE_BOUNDS.y1 });
      for (const [v, lo, hi] of [
        [a.x, region.x0, region.x1],
        [b.x, region.x0, region.x1],
        [a.y, region.y0, region.y1],
        [b.y, region.y0, region.y1],
      ]) {
        expect(v).toBeGreaterThanOrEqual(lo - 1e-6);
        expect(v).toBeLessThanOrEqual(hi + 1e-6);
      }
      // fitted: it touches the region on one axis
      const touches = Math.abs(b.x - a.x - (region.x1 - region.x0)) < 1e-6 || Math.abs(b.y - a.y - (region.y1 - region.y0)) < 1e-6;
      expect(touches).toBe(true);
      expect(sampleCraneCamera(1, view, 0)).toEqual(cam);
    }
  });

  it("follows the container while close: early on it stays near the centre as it rises", () => {
    const cam = sampleCraneCamera(0.05, desktop, 1200);
    const c = toScreen(cam, containerCentre(1200));
    expect(Math.abs(c.x - 720)).toBeLessThan(80);
    expect(Math.abs(c.y - 450)).toBeLessThan(80);
  });
});
