import { MathUtils, Vector3 } from "three";

type V3 = [number, number, number];
export type CameraKey = { position: V3; target: V3; fov: number };

// The hero's dive: the Northeast map seen from high above its plane (~60°, from the south, north up), aimed at its
// middle, down onto Suape (the map's origin). At runtime the start is refitted to the viewport beside (or above) the copy
// (CameraRig, heroFrame).
export const HERO_KEYS = {
  start: { position: [-30, 120, 62], target: [-30, 0, 6.5], fov: 35 },
  mid: { position: [-12, 38, 56], target: [-6, 0, 3], fov: 37 },
  end: { position: [-4, 22, 18], target: [0, 0, 0], fov: 40 },
} satisfies Record<string, CameraKey>;

const KEYS = [HERO_KEYS.start, HERO_KEYS.mid, HERO_KEYS.end];
const TIMES = [0, 0.5, 1];
const CHANNELS = [
  (k: CameraKey) => k.position[0],
  (k: CameraKey) => k.position[1],
  (k: CameraKey) => k.position[2],
  (k: CameraKey) => k.target[0],
  (k: CameraKey) => k.target[1],
  (k: CameraKey) => k.target[2],
  (k: CameraKey) => k.fov,
];
// Tangents: Catmull-Rom at the middle key, one-sided at the ends; the curve never stops at the middle.
const TANGENTS = KEYS.map((_, i) => {
  const a = Math.max(i - 1, 0);
  const b = Math.min(i + 1, KEYS.length - 1);
  return CHANNELS.map((c) => (c(KEYS[b]) - c(KEYS[a])) / (TIMES[b] - TIMES[a]));
});

export type CameraPose = { position: Vector3; target: Vector3; fov: number };
const v = new Array<number>(CHANNELS.length).fill(0);

// The camera at dive progress d (0–1): a cubic Hermite through the three keys.
export function sampleHeroCamera(
  d: number,
  out: CameraPose = { position: new Vector3(), target: new Vector3(), fov: 35 },
): CameraPose {
  const t = MathUtils.clamp(d, 0, 1);
  const i = t < 0.5 ? 0 : 1;
  const dt = TIMES[i + 1] - TIMES[i];
  const u = (t - TIMES[i]) / dt;
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  CHANNELS.forEach((c, k) => {
    v[k] = h00 * c(KEYS[i]) + h10 * dt * TANGENTS[i][k] + h01 * c(KEYS[i + 1]) + h11 * dt * TANGENTS[i + 1][k];
  });
  out.position.set(v[0], v[1], v[2]);
  out.target.set(v[3], v[4], v[5]);
  out.fov = v[6];
  return out;
}
