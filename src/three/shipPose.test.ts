import { MathUtils } from "three";
import { describe, expect, it } from "vitest";
import { DOCKED_BY, SLIDE, shipPoseAt } from "./shipPose";

describe("shipPoseAt", () => {
  it("starts 30 m back from the berth and glides in over 12 s, then stops", () => {
    expect(shipPoseAt(0, 0, false).slide).toBeCloseTo(SLIDE.distance, 6);
    expect(SLIDE).toMatchObject({ distance: 30, seconds: 12 });
    expect(shipPoseAt(6, 0, false).slide).toBeGreaterThan(0);
    expect(shipPoseAt(6, 0, false).slide).toBeLessThan(30);
    expect(shipPoseAt(12, 0, false).slide).toBe(0);
    expect(shipPoseAt(40, 0, false).slide).toBe(0);
  });

  it("only moves forward: the slide never grows with time", () => {
    let last = Infinity;
    for (let t = 0; t <= 14; t += 0.05) {
      const { slide } = shipPoseAt(t, 0, false);
      expect(slide).toBeLessThanOrEqual(last + 1e-9);
      last = slide;
    }
  });

  it("rolls gently, never past ±0.6°", () => {
    for (let t = 0; t < 30; t += 0.1) expect(Math.abs(shipPoseAt(t, 0, false).roll)).toBeLessThanOrEqual(MathUtils.degToRad(0.6) + 1e-9);
    expect(Math.max(...Array.from({ length: 300 }, (_, i) => Math.abs(shipPoseAt(i * 0.1, 0, false).roll)))).toBeGreaterThan(0.005);
  });

  it("is docked and still once the crane chapter is under way, whatever the clock says", () => {
    for (const t of [0, 3, 30]) {
      const pose = shipPoseAt(t, DOCKED_BY, false);
      expect(pose.slide).toBe(0);
      expect(pose.roll).toBe(0);
      expect(pose.speed).toBe(0);
    }
    expect(DOCKED_BY).toBeLessThan(0.15);
  });

  it("reports its speed for the wake: moving while it glides, zero once it stops", () => {
    expect(shipPoseAt(2, 0, false).speed).toBeGreaterThan(0);
    expect(shipPoseAt(13, 0, false).speed).toBe(0);
  });

  it("sits docked and still with reduced motion", () => {
    expect(shipPoseAt(0, 0, true)).toEqual({ slide: 0, roll: 0, speed: 0 });
  });
});
