import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, sampleCamera } from "./camera-path";
import { CHAPTERS } from "./chapters";

describe("sampleCamera", () => {
  // The hero's range is [0, 0], so its start and the crane's start share one boundary.
  it("has one key per distinct chapter boundary", () => {
    expect(CAMERA_KEYS).toHaveLength(CHAPTERS.length);
  });

  it("starts on the first key and ends on the last", () => {
    const first = CAMERA_KEYS[0];
    const last = CAMERA_KEYS[CAMERA_KEYS.length - 1];
    const a = sampleCamera(0);
    const b = sampleCamera(1);
    expect(a.position.distanceTo(first.position)).toBeLessThan(1e-9);
    expect(a.target.distanceTo(first.target)).toBeLessThan(1e-9);
    expect(b.position.distanceTo(last.position)).toBeLessThan(1e-9);
    expect(b.target.distanceTo(last.target)).toBeLessThan(1e-9);
  });

  it("clamps out-of-range progress to the ends", () => {
    expect(sampleCamera(-1).position.distanceTo(CAMERA_KEYS[0].position)).toBeLessThan(1e-9);
    expect(sampleCamera(2).position.distanceTo(CAMERA_KEYS[5].position)).toBeLessThan(1e-9);
  });

  it("eases into each key, so a tiny step near a key barely moves", () => {
    const k = CAMERA_KEYS[1].position;
    const near = sampleCamera(0.2 - 1e-4).position.distanceTo(k);
    const mid = sampleCamera(0.1).position.distanceTo(k);
    expect(near).toBeLessThan(mid * 1e-4);
  });

  it("writes into the given output without allocating", () => {
    const out = sampleCamera(0);
    const again = sampleCamera(0.5, out);
    expect(again).toBe(out);
  });
});
