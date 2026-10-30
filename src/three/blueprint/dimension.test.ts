import { describe, expect, it } from "vitest";
import { dimensionSegments } from "./dimension";

const segs = (flat: Float32Array) => Array.from({ length: flat.length / 6 }, (_, i) => [...flat.subarray(i * 6, i * 6 + 6)]);

describe("dimensionSegments", () => {
  // A 45 m height, drawn 6 m off to the side (+X).
  const flat = dimensionSegments([0, 0, 0], [0, 45, 0], [6, 0, 0]);
  const [extA, extB, line, tickA, tickB] = segs(flat);

  it("runs the dimension line parallel to the measure, at the offset", () => {
    expect(line).toEqual([6, 0, 0, 6, 45, 0]);
  });

  it("draws the extension lines from the points past the dimension line, leaving a small gap", () => {
    expect(extA[0]).toBeGreaterThan(0);
    expect(extA[3]).toBeGreaterThan(6);
    expect(extA[1]).toBe(0);
    expect(extB[4]).toBe(45);
  });

  it("closes both ends with 45° ticks centred on the dimension line", () => {
    for (const [tick, y] of [
      [tickA, 0],
      [tickB, 45],
    ] as const) {
      expect((tick[0] + tick[3]) / 2).toBeCloseTo(6);
      expect((tick[1] + tick[4]) / 2).toBeCloseTo(y);
      expect(Math.abs(tick[3] - tick[0])).toBeCloseTo(Math.abs(tick[4] - tick[1]));
    }
  });
});
