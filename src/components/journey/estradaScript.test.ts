import { describe, expect, it } from "vitest";
import { TRUCK_VIEWS, estradaHeightVh, phasesAt, roadDistance, trackPath, viewFit } from "./estradaScript";

describe("estrada's phases", () => {
  it("slides in over 100vh, then runs A, B, C and D (×0.75 on phones)", () => {
    expect(estradaHeightVh(false)).toBe(100 + 300 + 150 + 500 + 120);
    expect(estradaHeightVh(true)).toBe(100 + 0.75 * (300 + 150 + 500 + 120));
  });

  it("is all 0 at the top, all 1 at the end, and each phase starts where the one before ends", () => {
    for (const mobile of [false, true]) {
      expect(phasesAt(0, mobile)).toEqual({ slide: 0, a: 0, b: 0, c: 0, d: 0 });
      expect(phasesAt(1, mobile)).toEqual({ slide: 1, a: 1, b: 1, c: 1, d: 1 });
      const total = estradaHeightVh(mobile);
      const k = mobile ? 0.75 : 1;
      const aEnd = (100 + 300 * k) / total;
      expect(phasesAt(100 / total, mobile)).toMatchObject({ slide: 1, a: 0 });
      expect(phasesAt(aEnd, mobile)).toMatchObject({ a: 1, b: 0 });
      expect(phasesAt((100 + 375 * k) / total, mobile).b).toBeCloseTo(0.5);
    }
  });
});

describe("the truck's views", () => {
  it("line up the rear and keep the length", () => {
    const side = TRUCK_VIEWS.lado;
    for (const view of Object.values(TRUCK_VIEWS)) {
      const fit = viewFit(view);
      // the view's rear and front, in the side view's px
      expect(fit.left + view.rear * fit.k).toBeCloseTo(side.rear);
      expect((view.rear - view.front) * fit.k).toBeCloseTo(side.rear - side.front);
      // its anchor on the side view's road line
      expect(fit.top + view.anchor * fit.k).toBeCloseTo(side.anchor);
    }
  });
});

describe("the road", () => {
  it("starts still, speeds up, then cruises: the distance only grows", () => {
    expect(roadDistance(0)).toBe(0);
    expect(roadDistance(1)).toBeCloseTo(1);
    let last = 0;
    for (let t = 0.01; t <= 1; t += 0.01) {
      const d = roadDistance(t);
      expect(d).toBeGreaterThan(last);
      last = d;
    }
    // cruising: even steps late on
    expect(roadDistance(0.9) - roadDistance(0.8)).toBeCloseTo(roadDistance(0.6) - roadDistance(0.5));
  });
});

describe("the track", () => {
  it("comes in from the right along the straight road and heads left, then ends heading down", () => {
    for (const mobile of [false, true]) {
      const { d, start, end } = trackPath({ width: 1000, height: 800 }, 200, mobile);
      expect(d.startsWith("M1000 0H0")).toBe(true);
      expect(start).toBe(1000);
      // the last stretch heads straight down, to the dock
      expect(end.y).toBeGreaterThan(0);
      expect(d.trim().endsWith(`V${end.y}`)).toBe(true);
    }
  });
});
