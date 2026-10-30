import { MathUtils, Vector3 } from "three";
import type { ChapterId } from "../chapters";
import { type CameraKey, STAGE_CAMERAS } from "./cameras";
import { STAGE_IDS, STAGE_ORIGINS, STAGE_SPANS } from "./timeline";

// The camera across the whole journey = the current stage's origin + a pose in that stage's frame.
// The pose runs through every stage's start/middle/end keys on a cubic Hermite with finite-difference tangents:
// continuous in position and velocity, so it never stops at a key or a boundary. The origin only moves inside a
// transition, eased to zero speed at both ends, so it never adds a jolt.
type Frame = { t: number; stage: ChapterId; key: CameraKey };

const FRAMES: Frame[] = STAGE_IDS.flatMap((stage) => {
  const [a, b] = STAGE_SPANS[stage];
  const { start, mid, end } = STAGE_CAMERAS[stage];
  return [
    { t: a, stage, key: start },
    { t: (a + b) / 2, stage, key: mid },
    { t: b, stage, key: end },
  ];
});

type Channel = (k: CameraKey) => number;
const CHANNELS: Channel[] = [
  (k) => k.position[0],
  (k) => k.position[1],
  (k) => k.position[2],
  (k) => k.target[0],
  (k) => k.target[1],
  (k) => k.target[2],
  (k) => k.fov,
];

// Tangent of each channel at each frame, from that stage's own keys only: Catmull-Rom at the middle key,
// one-sided at the start and end. A neighbour in the next stage lives in another frame and can be far off (the
// road at cab height, then the terminal's plan view 150 m up): letting it into the tangent overshot the keys,
// and the camera dove under the road in chapter 3. The transitions use these tangents at both ends.
const TANGENTS = FRAMES.map((frame, i) => {
  const prev = FRAMES[i - 1]?.stage === frame.stage ? FRAMES[i - 1] : frame;
  const next = FRAMES[i + 1]?.stage === frame.stage ? FRAMES[i + 1] : frame;
  return CHANNELS.map((c) => (c(next.key) - c(prev.key)) / (next.t - prev.t));
});

export type CameraPose = { position: Vector3; target: Vector3; fov: number };

// Per-call scratch (sampled every frame): no allocation.
const v = new Array<number>(CHANNELS.length).fill(0);
const origin = new Vector3();
const nextOrigin = new Vector3();

export function sampleStageCamera(
  t: number,
  out: CameraPose = { position: new Vector3(), target: new Vector3(), fov: 35 },
): CameraPose {
  const p = MathUtils.clamp(t, 0, 1);
  let i = 0;
  while (i < FRAMES.length - 2 && p > FRAMES[i + 1].t) i++;
  const a = FRAMES[i];
  const b = FRAMES[i + 1];
  const dt = b.t - a.t;
  const u = MathUtils.clamp((p - a.t) / dt, 0, 1);
  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;
  for (let k = 0; k < CHANNELS.length; k++) {
    const c = CHANNELS[k];
    v[k] = h00 * c(a.key) + h10 * dt * TANGENTS[i][k] + h01 * c(b.key) + h11 * dt * TANGENTS[i + 1][k];
  }

  origin.set(...STAGE_ORIGINS[a.stage]);
  if (a.stage !== b.stage) origin.lerp(nextOrigin.set(...STAGE_ORIGINS[b.stage]), MathUtils.smootherstep(u, 0, 1));
  out.position.set(v[0], v[1], v[2]).add(origin);
  out.target.set(v[3], v[4], v[5]).add(origin);
  out.fov = v[6];
  return out;
}
