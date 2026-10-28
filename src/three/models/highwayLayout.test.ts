import { describe, expect, it } from "vitest";
import { HIGHWAY, loopX } from "./highwayLayout";

describe("loopX", () => {
  const from = HIGHWAY.x - HIGHWAY.length / 2;

  it("keeps every scrolled instance inside the strip", () => {
    for (const scroll of [0, 13.7, 999.1, -42]) {
      for (const x0 of [from, HIGHWAY.x, from + HIGHWAY.length - 0.01]) {
        const x = loopX(x0, scroll);
        expect(x).toBeGreaterThanOrEqual(from);
        expect(x).toBeLessThan(from + HIGHWAY.length);
      }
    }
  });

  it("moves things backward (-X) as the truck drives forward", () => {
    expect(loopX(HIGHWAY.x, 5)).toBeCloseTo(HIGHWAY.x - 5, 6);
  });

  it("wraps after a full strip, so the loop is seamless", () => {
    expect(loopX(HIGHWAY.x, HIGHWAY.length)).toBeCloseTo(HIGHWAY.x, 6);
  });
});
