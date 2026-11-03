import { describe, expect, it } from "vitest";
import { ESTRADA_HEIGHT_VH, TRUCK_VIEWS, phasesAt, rigCentre, roadDistance, thetaAt, trackPath, viewFit, viewWeights } from "./estradaScript";

describe("estrada's phases", () => {
  it("slides in over 100vh, runs A, B, C and D, then holds a screen under the next scene's slide", () => {
    expect(ESTRADA_HEIGHT_VH).toBe(100 + 300 + 150 + 500 + 120 + 100);
  });

  it("is all 0 at the top, all 1 at the end, and each phase starts where the one before ends", () => {
    expect(phasesAt(0)).toEqual({ slide: 0, a: 0, b: 0, c: 0, d: 0, e: 0 });
    expect(phasesAt(1)).toEqual({ slide: 1, a: 1, b: 1, c: 1, d: 1, e: 1 });
    const at = (vh: number) => phasesAt(vh / ESTRADA_HEIGHT_VH);
    expect(at(100)).toMatchObject({ slide: 1, a: 0 });
    expect(at(400)).toMatchObject({ a: 1, b: 0 });
    expect(at(475).b).toBeCloseTo(0.5);
    expect(at(1170)).toMatchObject({ d: 1, e: 0 });
  });
});

describe("the truck's views", () => {
  it("line up the rear wheel's contact and the cab's nose", () => {
    const side = TRUCK_VIEWS.lado;
    for (const view of Object.values(TRUCK_VIEWS)) {
      const fit = viewFit(view);
      expect(fit.left + view.wheel.x * fit.k).toBeCloseTo(side.wheel.x);
      expect(fit.top + view.wheel.y * fit.k).toBeCloseTo(side.wheel.y);
      expect(fit.left + view.front * fit.k).toBeCloseTo(side.front);
    }
  });

  it("turn about the middle of the footprint seen from above", () => {
    const top = TRUCK_VIEWS.cima;
    const fit = viewFit(top);
    const c = rigCentre();
    expect(c.x).toBeCloseTo(fit.left + ((top.front + top.rear) / 2) * fit.k);
    expect(c.y).toBeCloseTo(fit.top + ((top.top + top.bottom) / 2) * fit.k);
  });
});

describe("the camera rising (B)", () => {
  it("takes the angle from 0° to 90°, smoothly and only up", () => {
    expect(thetaAt(0)).toBe(0);
    expect(thetaAt(1)).toBeCloseTo(90);
    let last = -1;
    for (let b = 0; b <= 1; b += 0.01) {
      const t = thetaAt(b);
      expect(t).toBeGreaterThan(last);
      // no step: never more than 3° a hundredth
      if (last >= 0) expect(t - last).toBeLessThan(3);
      last = t;
    }
  });

  it("crossfades the views over long overlapping windows, each view whole at its own angle", () => {
    expect(viewWeights(0)).toEqual([1, 0, 0, 0]);
    expect(viewWeights(30)).toEqual([0, 1, 0, 0]);
    expect(viewWeights(60)).toEqual([0, 0, 1, 0]);
    expect(viewWeights(90)).toEqual([0, 0, 0, 1]);
    // halfway into the 30° view: both show
    const mid = viewWeights(15);
    expect(mid[0]).toBeGreaterThan(0);
    expect(mid[1]).toBeGreaterThan(0);
    // each crossfade spans 18° (20% of the phase)
    expect(viewWeights(6.5)[1]).toBeGreaterThan(0);
    expect(viewWeights(5.5)[1]).toBe(0);
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
