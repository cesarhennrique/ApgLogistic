import { describe, expect, it } from "vitest";
import { phoneLength, toDesktop, toPhone } from "./sceneScroll";

const phone = { head: 100, tail: 100, scale: 0.75 };

describe("a scene's scroll on phones", () => {
  it("is shorter by the scale, but for its head and tail", () => {
    expect(phoneLength(320, phone)).toBe(100 + 100 + 0.75 * 120);
    expect(phoneLength(260, { tail: 100, scale: 0.75 })).toBe(100 + 0.75 * 160);
  });

  it("runs the head and the tail a vh for a vh, the middle 1/scale vh for each", () => {
    const len = phoneLength(320, phone);
    // the end of the head, of the middle, the end
    expect(toDesktop(100 / len, 320, phone)).toBeCloseTo(100 / 320);
    expect(toDesktop(190 / len, 320, phone)).toBeCloseTo(220 / 320);
    expect(toDesktop(1, 320, phone)).toBeCloseTo(1);
    expect(toDesktop(0, 320, phone)).toBe(0);
    // halfway through the middle
    expect(toDesktop(145 / len, 320, phone)).toBeCloseTo(160 / 320);
  });

  it("goes back the same way", () => {
    for (let p = 0; p <= 1; p += 0.05) expect(toDesktop(toPhone(p, 320, phone), 320, phone)).toBeCloseTo(p);
  });
});
