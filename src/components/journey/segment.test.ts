import { describe, expect, it } from "vitest";
import { segment } from "./segment";

describe("segment", () => {
  it("is 0 before the range, 1 after it, and linear inside by default", () => {
    expect(segment(0.1, 0.2, 0.6)).toBe(0);
    expect(segment(0.2, 0.2, 0.6)).toBe(0);
    expect(segment(0.4, 0.2, 0.6)).toBeCloseTo(0.5);
    expect(segment(0.6, 0.2, 0.6)).toBe(1);
    expect(segment(0.9, 0.2, 0.6)).toBe(1);
  });

  it("applies the ease to the local progress, and stays inside 0–1", () => {
    const easeIn = (x: number) => x * x;
    expect(segment(0.4, 0.2, 0.6, easeIn)).toBeCloseTo(0.25);
    for (let p = -0.5; p <= 1.5; p += 0.01) {
      const v = segment(p, 0.3, 0.7, easeIn);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("composes enter → hold → leave", () => {
    const shown = (p: number) => segment(p, 0.1, 0.2) * (1 - segment(p, 0.8, 0.9));
    expect(shown(0.05)).toBe(0);
    expect(shown(0.5)).toBe(1);
    expect(shown(0.95)).toBe(0);
  });
});
