import { describe, expect, it } from "vitest";
import { LOADER, loadTarget, stepCounter } from "./loaderProgress";

const none = { fonts: false, assets: 0, frame: false };
const all = { fonts: true, assets: 1, frame: true };

// Runs the counter at 60 fps against a signal timeline, returning every displayed value.
function run(signalsAt: (ms: number) => typeof none, until = 5000) {
  const values: number[] = [];
  let counter = 0;
  for (let ms = 0; ms <= until; ms += 16) {
    counter = stepCounter(counter, loadTarget(signalsAt(ms), ms), ms, 16);
    values.push(counter);
  }
  return values;
}

describe("loader progress", () => {
  it("weighs fonts 20%, 3D assets 60% and the first frame 20%", () => {
    expect(loadTarget(none, 0)).toBe(0);
    expect(loadTarget({ ...none, fonts: true }, 0)).toBe(20);
    expect(loadTarget({ ...none, assets: 0.5 }, 0)).toBe(30);
    expect(loadTarget({ ...none, frame: true }, 0)).toBe(20);
    expect(loadTarget(all, 0)).toBe(100);
  });

  it("never moves backwards, even when the asset signal drops", () => {
    const values = run((ms) => ({ fonts: ms > 100, assets: ms < 600 ? ms / 600 : 0.4, frame: ms > 900 }));
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
  });

  it("takes at least the minimum time, even when everything is ready at once", () => {
    const values = run(() => all);
    const done = values.findIndex((v) => v === 100) * 16;
    expect(done).toBeGreaterThanOrEqual(LOADER.minMs);
    expect(done).toBeLessThan(LOADER.minMs + 100);
  });

  it("reaches 100 by the maximum time even when the 3D never arrives", () => {
    const values = run(() => ({ fonts: true, assets: 0, frame: false }));
    const done = values.findIndex((v) => v === 100) * 16;
    expect(done).toBeGreaterThan(0);
    // Within one 60 fps frame of the maximum.
    expect(done).toBeLessThanOrEqual(LOADER.maxMs + 16);
    expect(values.at(-1)).toBe(100);
  });
});
