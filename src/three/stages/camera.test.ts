import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { HIGHWAY } from "../models/highwayLayout";
import { STAGE_CAMERAS } from "./cameras";
import { sampleStageCamera } from "./camera";
import { STAGE_IDS, STAGE_ORIGINS, STAGE_SPANS } from "./timeline";

const world = (id: (typeof STAGE_IDS)[number], local: [number, number, number]) =>
  new Vector3(...local).add(new Vector3(...STAGE_ORIGINS[id]));

function velocity(t: number, h: number) {
  return sampleStageCamera(t + h).position.clone().sub(sampleStageCamera(t).position).divideScalar(h);
}

describe("sampleStageCamera", () => {
  it("sits on each stage's start, middle and end keys at its span's start, middle and end", () => {
    for (const id of STAGE_IDS) {
      const [a, b] = STAGE_SPANS[id];
      const keys = STAGE_CAMERAS[id];
      for (const [t, key] of [
        [a, keys.start],
        [(a + b) / 2, keys.mid],
        [b, keys.end],
      ] as const) {
        const s = sampleStageCamera(t);
        expect(s.position.distanceTo(world(id, key.position))).toBeLessThan(1e-6);
        expect(s.target.distanceTo(world(id, key.target))).toBeLessThan(1e-6);
        expect(s.fov).toBeCloseTo(key.fov, 6);
      }
    }
  });

  it("never stops at a boundary: the speed is not zero, and it is the same on both sides", () => {
    // One-sided differences: their gap is ~acceleration × h, so h stays tiny.
    const h = 1e-7;
    for (const id of STAGE_IDS) {
      for (const t of STAGE_SPANS[id]) {
        if (t <= 0 || t >= 1) continue;
        const before = velocity(t - h, h);
        const after = velocity(t, h);
        expect(after.length(), `${id} at ${t}`).toBeGreaterThan(1);
        expect(before.distanceTo(after) / after.length(), `${id} at ${t}`).toBeLessThan(0.02);
      }
    }
  });

  it("moves without jumps inside each stage's span", () => {
    // Per 0.001 of progress (~5 px of scroll); the hero dive covers ~170 m in 0.03.
    for (const id of STAGE_IDS) {
      const [a, b] = STAGE_SPANS[id];
      let last = sampleStageCamera(a).position.clone();
      for (let t = a + 0.001; t <= b; t += 0.001) {
        const p = sampleStageCamera(t).position;
        expect(p.distanceTo(last), `${id} at ${t.toFixed(3)}`).toBeLessThan(8);
        last = p.clone();
      }
    }
  });

  // Chapter 3 is shot from the road's edge at cab height: the camera must never dip under the road or the guard
  // rail (a cubic overshoot did, pulled by the climb to the terminal's plan view).
  it("stays above the road and clear of the guard rail through the highway chapter", () => {
    const [a, b] = STAGE_SPANS.highway;
    const origin = new Vector3(...STAGE_ORIGINS.highway);
    // The rail's top; a metre above it keeps the road and the rails (both below) twice the near plane (0.5 m) away.
    const railTop = HIGHWAY.roadY + 0.95;
    for (let t = a; t <= b; t += 0.0005) {
      const p = sampleStageCamera(t).position.clone().sub(origin);
      expect(p.y, `t=${t.toFixed(4)}`).toBeGreaterThan(railTop + 1);
    }
  });

  it("clamps outside 0–1", () => {
    expect(sampleStageCamera(-1).position.distanceTo(sampleStageCamera(0).position)).toBeLessThan(1e-9);
    expect(sampleStageCamera(2).position.distanceTo(sampleStageCamera(1).position)).toBeLessThan(1e-9);
  });
});
