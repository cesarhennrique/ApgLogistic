import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { HERO_KEYS, sampleHeroCamera } from "./heroCamera";

describe("sampleHeroCamera", () => {
  it("sits on the start, middle and end keys of the dive", () => {
    for (const [d, key] of [
      [0, HERO_KEYS.start],
      [0.5, HERO_KEYS.mid],
      [1, HERO_KEYS.end],
    ] as const) {
      const pose = sampleHeroCamera(d);
      expect(pose.position.distanceTo(new Vector3(...key.position))).toBeLessThan(1e-9);
      expect(pose.target.distanceTo(new Vector3(...key.target))).toBeLessThan(1e-9);
      expect(pose.fov).toBeCloseTo(key.fov);
    }
  });

  it("dives without jumps, always coming down, and doesn't stop at the middle key", () => {
    let last = sampleHeroCamera(0).position.clone();
    for (let d = 0.001; d <= 1; d += 0.001) {
      const p = sampleHeroCamera(d).position;
      expect(p.distanceTo(last)).toBeLessThan(0.5);
      expect(p.y).toBeLessThanOrEqual(last.y + 1e-9);
      last = p.clone();
    }
    const h = 1e-6;
    const speed = sampleHeroCamera(0.5 + h).position.distanceTo(sampleHeroCamera(0.5).position) / h;
    expect(speed).toBeGreaterThan(1);
  });

  it("clamps outside 0–1", () => {
    expect(sampleHeroCamera(-1).position.distanceTo(sampleHeroCamera(0).position)).toBe(0);
    expect(sampleHeroCamera(2).position.distanceTo(sampleHeroCamera(1).position)).toBe(0);
  });
});
