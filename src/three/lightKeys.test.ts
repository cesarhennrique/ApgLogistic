import { describe, expect, it } from "vitest";
import { LIGHT_KEYS, sampleLight, sunDirection, type LightSample } from "./lightKeys";

// Every scalar the scene reads, flattened (colors by channel).
function flatten(s: LightSample): number[] {
  const out: number[] = [];
  for (const value of Object.values(s)) {
    if (typeof value === "number") out.push(value);
    else out.push(value.r, value.g, value.b);
  }
  return out;
}

describe("sampleLight", () => {
  it("has keys at sunset, late sunset, dusk and night", () => {
    expect(LIGHT_KEYS.map((k) => k.t)).toEqual([0, 0.4, 0.6, 1]);
  });

  it("hits each key exactly on its t", () => {
    for (const key of LIGHT_KEYS) {
      const s = sampleLight(key.t);
      expect(s.exposure).toBeCloseTo(key.exposure, 10);
      expect(s.sunElevation).toBeCloseTo(key.sunElevation, 10);
      expect(s.skyHorizon.getHex()).toBe(key.skyHorizon.getHex());
    }
  });

  it("clamps out-of-range progress to the ends", () => {
    expect(flatten(sampleLight(-1))).toEqual(flatten(sampleLight(0)));
    expect(flatten(sampleLight(2))).toEqual(flatten(sampleLight(1)));
  });

  it("fogs with the sky's horizon color, so sea and sky meet without a seam", () => {
    for (const t of [0, 0.25, 0.5, 0.8, 1]) {
      const s = sampleLight(t);
      expect(s.fogColor.equals(s.skyHorizon)).toBe(true);
    }
  });

  it("shows stars only after dusk (0.6)", () => {
    expect(sampleLight(0).stars).toBe(0);
    expect(sampleLight(0.6).stars).toBe(0);
    expect(sampleLight(0.8).stars).toBeGreaterThan(0);
    expect(sampleLight(1).stars).toBe(1);
  });

  it("never jumps more than 2% of a quantity's range between t and t + 0.001", () => {
    const steps = 1000;
    const samples = Array.from({ length: steps + 1 }, (_, i) => flatten(sampleLight(i / steps)));
    const keys = LIGHT_KEYS.map((k) => flatten(sampleLight(k.t)));
    for (let q = 0; q < samples[0].length; q++) {
      const values = keys.map((k) => k[q]);
      const range = Math.max(...values) - Math.min(...values);
      if (range === 0) continue;
      for (let i = 0; i < steps; i++) {
        expect(Math.abs(samples[i + 1][q] - samples[i][q]) / range).toBeLessThan(0.02);
      }
    }
  });

  it("writes into the given output without allocating", () => {
    const out = sampleLight(0);
    expect(sampleLight(0.5, out)).toBe(out);
  });
});

describe("sunDirection", () => {
  it("looks down -Z at azimuth 0 and turns left for negative azimuths", () => {
    const ahead = sunDirection(0, 0);
    expect(ahead.z).toBeCloseTo(-1, 10);
    expect(sunDirection(-14, 3).x).toBeLessThan(0);
    expect(sunDirection(-14, 3).length()).toBeCloseTo(1, 10);
  });
});
