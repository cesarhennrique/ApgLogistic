import { Color } from "three";
import { describe, expect, it } from "vitest";
import { NAVY, SAND, stageBackground } from "./background";

const close = (a: Color, b: Color) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

describe("stageBackground", () => {
  it("uses the brand's navy-900 and sand-50", () => {
    expect(NAVY.getHexString()).toBe("0a1338");
    expect(SAND.getHexString()).toBe("f3efe7");
  });

  it("runs navy (hero) → sand (1–2) → navy (3) → sand (4–5) → navy (exit)", () => {
    const at = (t: number) => stageBackground(t);
    for (const t of [0]) expect(close(at(t), NAVY)).toBeLessThan(1e-6);
    for (const t of [0.05, 0.2, 0.4]) expect(close(at(t), SAND)).toBeLessThan(1e-6);
    for (const t of [0.42, 0.5, 0.6]) expect(close(at(t), NAVY)).toBeLessThan(1e-6);
    for (const t of [0.62, 0.75, 0.9]) expect(close(at(t), SAND)).toBeLessThan(1e-6);
    expect(close(at(1), NAVY)).toBeLessThan(1e-6);
  });

  it("changes color only in short transitions (0.02–0.05), and smoothly", () => {
    let last = stageBackground(0);
    for (let t = 0.001; t <= 1; t += 0.001) {
      const c = stageBackground(t);
      // Navy ↔ sand is ~0.9 per channel (linear); spread over ≥ 0.02 with an ease, a step stays small.
      expect(close(c, last)).toBeLessThan(0.08);
      last = c;
    }
  });

  it("writes into the given color without allocating", () => {
    const out = new Color();
    expect(stageBackground(0.3, out)).toBe(out);
  });
});
