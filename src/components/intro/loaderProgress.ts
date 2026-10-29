// The first-visit loader's counter (spec §5): real loading, weighed, shown no faster than the minimum time and
// forced to 100 at the maximum. The spec's maximum is 4 s; forcing at 3.8 s leaves room for a late frame.
export const LOADER = { minMs: 1200, maxMs: 3800 };

export type LoadSignals = {
  // document.fonts.ready resolved.
  fonts: boolean;
  // drei's useProgress, 0–1 (latched at 1 once the hero's assets are in).
  assets: number;
  // The hero map has rendered a frame.
  frame: boolean;
};

// Where the counter is heading, 0–100.
export function loadTarget(s: LoadSignals, elapsedMs: number): number {
  if (elapsedMs >= LOADER.maxMs) return 100;
  return (s.fonts ? 20 : 0) + 60 * Math.min(Math.max(s.assets, 0), 1) + (s.frame ? 20 : 0);
}

// Full sweep in 400 ms at most, so a jump in the signals still reads as counting.
const SPEED = 100 / 400;

// The next displayed value: toward the target, never past the minimum-time ramp, never backwards.
export function stepCounter(prev: number, target: number, elapsedMs: number, dtMs: number): number {
  if (elapsedMs >= LOADER.maxMs) return 100;
  const ramp = (elapsedMs / LOADER.minMs) * 100;
  const next = Math.min(target, ramp, prev + dtMs * SPEED, 100);
  return Math.max(prev, next);
}
