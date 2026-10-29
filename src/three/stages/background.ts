import { Color, MathUtils } from "three";

export const NAVY = new Color("#0a1338");
export const SAND = new Color("#f3efe7");

// The page's color rhythm under the stages: navy (hero) → sand (chapters 1–2) → navy (3) → sand (4–5) → navy
// (the exit into Services). Each pair is a short eased transition.
const STOPS: [number, Color][] = [
  [0, NAVY],
  [0.05, SAND],
  [0.4, SAND],
  [0.42, NAVY],
  [0.6, NAVY],
  [0.62, SAND],
  [0.95, SAND],
  [1, NAVY],
];

export function stageBackground(t: number, out = new Color()): Color {
  const p = MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < STOPS.length - 2 && p > STOPS[i + 1][0]) i++;
  const [a, from] = STOPS[i];
  const [b, to] = STOPS[i + 1];
  return out.lerpColors(from, to, MathUtils.smoothstep(p, a, b));
}
