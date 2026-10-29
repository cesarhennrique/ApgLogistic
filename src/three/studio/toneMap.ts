import type { Color } from "three";

type V3 = [number, number, number];
type M3 = [V3, V3, V3]; // columns, like GLSL mat3(c0, c1, c2)

// The post-processing ToneMapping effect runs three's own GLSL curves (tonemapping_pars_fragment); these are
// exact ports, so the scene's background can be solved backwards to land on the brand color.
export type ToneMappingName = "aces" | "agx";
export const TONE_MAPPING: ToneMappingName = "aces";

const mul = (m: M3, v: V3): V3 => [
  m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
  m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
  m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2],
];
const clamp01 = (v: V3): V3 => v.map((x) => Math.min(Math.max(x, 0), 1)) as V3;

const ACES_IN: M3 = [
  [0.59719, 0.076, 0.0284],
  [0.35458, 0.90834, 0.13383],
  [0.04823, 0.01566, 0.83777],
];
const ACES_OUT: M3 = [
  [1.60475, -0.10208, -0.00327],
  [-0.53108, 1.10813, -0.07276],
  [-0.07367, -0.00605, 1.07602],
];

function aces(c: V3): V3 {
  const v = mul(ACES_IN, c.map((x) => x / 0.6) as V3);
  const fit = v.map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081)) as V3;
  return clamp01(mul(ACES_OUT, fit));
}

const SRGB_TO_2020: M3 = [
  [0.6274, 0.0691, 0.0164],
  [0.3293, 0.9195, 0.088],
  [0.0433, 0.0113, 0.8956],
];
const REC2020_TO_SRGB: M3 = [
  [1.6605, -0.1246, -0.0182],
  [-0.5876, 1.1329, -0.1006],
  [-0.0728, -0.0083, 1.1187],
];
const AGX_INSET: M3 = [
  [0.856627153315983, 0.137318972929847, 0.11189821299995],
  [0.0951212405381588, 0.761241990602591, 0.0767994186031903],
  [0.0482516061458583, 0.101439036467562, 0.811302368396859],
];
const AGX_OUTSET: M3 = [
  [1.1271005818144368, -0.1413297634984383, -0.14132976349843826],
  [-0.11060664309660323, 1.157823702216272, -0.11060664309660294],
  [-0.016493938717834573, -0.016493938717834257, 1.2519364065950405],
];

function agx(c: V3): V3 {
  const [minEv, maxEv] = [-12.47393, 4.026069];
  let v = mul(AGX_INSET, mul(SRGB_TO_2020, c));
  v = v.map((x) => Math.min(Math.max((Math.log2(Math.max(x, 1e-10)) - minEv) / (maxEv - minEv), 0), 1)) as V3;
  v = v.map((x) => {
    const x2 = x * x;
    const x4 = x2 * x2;
    return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
  }) as V3;
  v = mul(AGX_OUTSET, v).map((x) => Math.pow(Math.max(0, x), 2.2)) as V3;
  return clamp01(mul(REC2020_TO_SRGB, v));
}

export function toneMap(c: V3, mode: ToneMappingName = TONE_MAPPING): V3 {
  return mode === "aces" ? aces(c) : agx(c);
}

// The linear scene color that tone-maps to `target` (linear sRGB): Newton's method on the 3×3 curve, with a
// numeric Jacobian. Written into `out`.
export function untoneMap(target: V3, out: Color, mode: ToneMappingName = TONE_MAPPING): Color {
  // Start above the curve's flat clamp just over black (ACES), where the Jacobian would vanish.
  let x: V3 = target.map((v) => v * 1.6 + 0.01) as V3;
  const residual = (y: V3) => {
    const f = toneMap(y, mode);
    return Math.max(Math.abs(f[0] - target[0]), Math.abs(f[1] - target[1]), Math.abs(f[2] - target[2]));
  };
  for (let iter = 0; iter < 60; iter++) {
    const f = toneMap(x, mode);
    const r: V3 = [f[0] - target[0], f[1] - target[1], f[2] - target[2]];
    if (Math.max(...r.map(Math.abs)) < 1e-7) break;
    // J[row][col] = d f_row / d x_col
    const h = 1e-5;
    const J = [0, 1, 2].map((col) => {
      const xp: V3 = [...x];
      xp[col] += h;
      const fp = toneMap(xp, mode);
      return [(fp[0] - f[0]) / h, (fp[1] - f[1]) / h, (fp[2] - f[2]) / h];
    });
    // Solve J * d = r (Cramer's rule; J is columns here).
    const [c0, c1, c2] = J;
    const det = (a: number[], b: number[], c: number[]) =>
      a[0] * (b[1] * c[2] - b[2] * c[1]) - b[0] * (a[1] * c[2] - a[2] * c[1]) + c[0] * (a[1] * b[2] - a[2] * b[1]);
    const D = det(c0, c1, c2);
    // Near black a channel can clamp to 0 and the Jacobian goes singular: step each channel on its own then.
    const d: V3 =
      Math.abs(D) > 1e-12
        ? [det(r, c1, c2) / D, det(c0, r, c2) / D, det(c0, c1, r) / D]
        : [r[0] / Math.max(c0[0], 1e-3), r[1] / Math.max(c1[1], 1e-3), r[2] / Math.max(c2[2], 1e-3)];
    // Backtracking: halve the step until it doesn't make things worse.
    const before = residual(x);
    let step = 1;
    let next: V3 = x;
    for (let k = 0; k < 20; k++, step /= 2) {
      next = [Math.max(x[0] - d[0] * step, 0), Math.max(x[1] - d[1] * step, 0), Math.max(x[2] - d[2] * step, 0)];
      if (residual(next) < before) break;
    }
    x = next;
  }
  return out.setRGB(x[0], x[1], x[2]);
}
