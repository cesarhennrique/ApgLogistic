import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../chapters";
import { STAGE_IDS, STAGE_ORIGINS, STAGE_SPANS, activeStages } from "./timeline";

describe("stage timeline", () => {
  it("has one stage per chapter, in the journey's order", () => {
    expect(STAGE_IDS).toEqual(CHAPTERS.map((c) => c.id));
  });

  it("keeps every stage at least 1 km from every other", () => {
    for (const a of STAGE_IDS)
      for (const b of STAGE_IDS) {
        if (a === b) continue;
        const [ax, ay, az] = STAGE_ORIGINS[a];
        const [bx, by, bz] = STAGE_ORIGINS[b];
        expect(Math.hypot(ax - bx, ay - by, az - bz)).toBeGreaterThanOrEqual(1000);
      }
  });

  it("orders the spans with a short transition window between neighbors", () => {
    for (let i = 1; i < STAGE_IDS.length; i++) {
      const [, prevEnd] = STAGE_SPANS[STAGE_IDS[i - 1]];
      const [start, end] = STAGE_SPANS[STAGE_IDS[i]];
      expect(start - prevEnd).toBeGreaterThan(0);
      expect(start - prevEnd).toBeLessThanOrEqual(0.05);
      expect(end).toBeGreaterThan(start);
    }
    expect(STAGE_SPANS.hero[0]).toBe(0);
    expect(STAGE_SPANS.distribution[1]).toBe(1);
  });

  it("activeStages returns 1 or 2 ids, never more, across the whole journey", () => {
    for (let t = -0.1; t <= 1.1; t += 0.0005) {
      const ids = activeStages(t);
      expect(ids.length).toBeGreaterThanOrEqual(1);
      expect(ids.length).toBeLessThanOrEqual(2);
      if (ids.length === 2) expect(STAGE_IDS.indexOf(ids[1]) - STAGE_IDS.indexOf(ids[0])).toBe(1);
    }
  });

  it("shows one stage inside its span and the pair in a transition", () => {
    expect(activeStages(0)).toEqual(["hero"]);
    expect(activeStages(0.04)).toEqual(["hero", "crane"]);
    expect(activeStages(0.1)).toEqual(["crane"]);
    expect(activeStages(0.41)).toEqual(["load", "highway"]);
    expect(activeStages(1)).toEqual(["distribution"]);
  });
});
