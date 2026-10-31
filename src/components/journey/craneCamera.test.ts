import { describe, expect, it } from "vitest";
import { toScreen } from "./oceanCamera";
import { CONTAINER_BOX, SPREADER } from "./craneAnchors";
import { CONTAINER, TRUCK_IN_CRANE, WIDE, craneHandoff, frameRegion, sampleCraneCamera, seatDrop } from "./craneCamera";

const desktop = { width: 1440, height: 900, dpr: 1 };
const wideDesktop = { width: 1920, height: 1080, dpr: 1 };
const retina = { width: 1440, height: 900, dpr: 2 };
const phone = { width: 390, height: 664, dpr: 3 };

describe("craneCamera", () => {
  it("opens on the whole crane, fitted to the screen", () => {
    for (const view of [desktop, phone]) {
      const cam = sampleCraneCamera(0, view);
      const region = frameRegion(view);
      const a = toScreen(cam, { x: WIDE(view).x0, y: WIDE(view).y0 });
      const b = toScreen(cam, { x: WIDE(view).x1, y: WIDE(view).y1 });
      expect(a.x).toBeGreaterThanOrEqual(region.x0 - 1e-6);
      expect(b.x).toBeLessThanOrEqual(region.x1 + 1e-6);
      expect(a.y).toBeGreaterThanOrEqual(region.y0 - 1e-6);
      expect(b.y).toBeLessThanOrEqual(region.y1 + 1e-6);
      const touches = Math.abs(b.x - a.x - (region.x1 - region.x0)) < 1e-6 || Math.abs(b.y - a.y - (region.y1 - region.y0)) < 1e-6;
      expect(touches).toBe(true);
    }
  });

  it("zooms in exponentially: equal steps multiply the scale by the same ratio", () => {
    const steps = [0.1, 0.3, 0.5, 0.7, 0.9].map((t) => sampleCraneCamera(t, desktop).scale);
    const ratios = steps.slice(1).map((s, i) => s / steps[i]);
    for (const r of ratios) expect(r).toBeCloseTo(ratios[0], 9);
    expect(ratios[0]).toBeGreaterThan(1);
  });

  it("ends on the waiting truck framed as scene 3 opens on it (90vw, centred at 54% of the height) where the pixels allow", () => {
    const cam = sampleCraneCamera(1, desktop);
    const truck = craneHandoff(desktop).truck;
    expect(truck.w).toBeCloseTo(0.9 * 1440, 3);
    expect(truck.x + truck.w / 2).toBeCloseTo(720, 3);
    expect(truck.y + truck.h / 2).toBeCloseTo(0.54 * 900, 3);
    expect(toScreen(cam, { x: TRUCK_IN_CRANE.x, y: TRUCK_IN_CRANE.y }).x).toBeCloseTo(truck.x, 6);
  });

  it("never magnifies a pixel of the crane image past 1.5 device pixels", () => {
    for (const view of [desktop, wideDesktop, retina, phone]) {
      expect(sampleCraneCamera(1, view).scale * view.dpr).toBeLessThanOrEqual(1.5 + 1e-9);
    }
  });

  it("puts the truck under the spreader, its container box right below the APG container, at the crane's scale", () => {
    const scale = TRUCK_IN_CRANE.w / 1672;
    expect(TRUCK_IN_CRANE.x + CONTAINER_BOX.x * scale).toBeCloseTo(SPREADER.x, 6);
    expect(CONTAINER_BOX.w * scale).toBeCloseTo(CONTAINER.w, 6);
    // lowered by seatDrop, the container sits exactly in the truck's container box
    expect(CONTAINER.top + seatDrop).toBeCloseTo(TRUCK_IN_CRANE.y + CONTAINER_BOX.y * scale, 6);
  });
});
