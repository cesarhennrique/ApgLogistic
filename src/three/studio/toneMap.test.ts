import { Color } from "three";
import { describe, expect, it } from "vitest";
import { NAVY, SAND } from "../stages/background";
import { toneMap, untoneMap } from "./toneMap";

describe("toneMap / untoneMap", () => {
  it("maps black to black and stays in 0–1", () => {
    expect(toneMap([0, 0, 0]).every((v) => Math.abs(v) < 1e-3)).toBe(true);
    for (const v of toneMap([8, 4, 2])) expect(v).toBeLessThanOrEqual(1);
  });

  it("finds the scene color that comes out as exactly the brand background after tone mapping", () => {
    for (const brand of [SAND, NAVY]) {
      const target: [number, number, number] = [brand.r, brand.g, brand.b];
      const out = toneMap(untoneMap(target, new Color()).toArray() as [number, number, number]);
      // Under half an 8-bit step in sRGB.
      const srgb = (c: number[]) => new Color(c[0], c[1], c[2]).convertLinearToSRGB();
      const a = srgb(out);
      const b = srgb(target);
      expect(Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b))).toBeLessThan(0.5 / 255);
    }
  });
});
