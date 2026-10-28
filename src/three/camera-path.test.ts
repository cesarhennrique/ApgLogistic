import { describe, expect, it } from "vitest";
import { CAMERA_KEYS, KEY_TIMES, sampleCamera } from "./camera-path";
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
    const near = sampleCamera(KEY_TIMES[1] - 1e-4).position.distanceTo(k);
    const mid = sampleCamera(KEY_TIMES[1] / 2).position.distanceTo(k);
    expect(near).toBeLessThan(mid * 1e-4);
  });

  it("reaches each scene on its beat: the crane's lock, the landing, the highway, the yard, the map", () => {
    expect(KEY_TIMES).toEqual([0, 0.15, 0.4, 0.52, 0.75, 0.95]);
    KEY_TIMES.forEach((t, i) => expect(sampleCamera(t).position.distanceTo(CAMERA_KEYS[i].position)).toBeLessThan(1e-9));
  });

  it("holds on the map through the exit to navy (0.95–1)", () => {
    const last = CAMERA_KEYS[CAMERA_KEYS.length - 1].position;
    expect(sampleCamera(0.97).position.distanceTo(last)).toBeLessThan(1e-9);
  });

  it("writes into the given output without allocating", () => {
    const out = sampleCamera(0);
    const again = sampleCamera(0.5, out);
    expect(again).toBe(out);
  });
});
