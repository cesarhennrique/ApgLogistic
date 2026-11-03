// Scene 5's camera over the hero's map, straight down (north up): where the map's origin (the CONE terminal's point)
// sits on screen and how many px a map unit is. It opens close on the terminal, the point exactly where scene 4
// leaves its dock (CONE_AT), and pulls back, exponentially, to PE and BA filling their region (right of the copy on
// wide screens, above it on phones).

type View = { width: number; height: number };
export type Bounds = { minX: number; maxX: number; minZ: number; maxZ: number };

// (Plain numbers, no three.js: the scene's DOM places its dot and labels with this camera too. The tests check
// them against the map.) PE and BA's extents in map units, what the camera pulls back to; Salvador's hub.
export const PE_BA_BOUNDS = { minX: -58, maxX: 0.66, minZ: -5.58, maxZ: 49.74 };
export const SALVADOR_AT = { x: -17.7, z: 22.9 };

// The script over the scene's progress (c): the map fades in round the terminal's point, the camera pulls back.
export const MAP_IN = [0, 0.12] as const;
export const PULL_BACK = [0.04, 0.98] as const;
export const smoother = (p: number, [a, b]: readonly [number, number]) => {
  const t = Math.min(Math.max((p - a) / (b - a), 0), 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// The terminal's point on screen as scene 4 ends and scene 5 begins.
export const CONE_AT = ({ width, height }: View) => (width >= 768 ? { x: 0.62 * width, y: 0.46 * height } : { x: 0.5 * width, y: 0.42 * height });

// px per map unit at the open: the dot grid's step (0.7) about 22 px.
const OPEN_SCALE = 32;

function region({ width, height }: View) {
  return width >= 768
    ? { left: 0.42 * width, right: 0.96 * width, top: 0.1 * height, bottom: 0.92 * height }
    : { left: 0.05 * width, right: 0.95 * width, top: 0.1 * height, bottom: 0.6 * height };
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// t: the pull-back's progress (0 close, 1 the whole of PE and BA).
export function sampleDistributionCamera(t: number, view: View, bounds: Bounds) {
  const r = region(view);
  const end = Math.min((r.right - r.left) / (bounds.maxX - bounds.minX), (r.bottom - r.top) / (bounds.maxZ - bounds.minZ));
  const tt = Math.min(Math.max(t, 0), 1);
  const scale = OPEN_SCALE * (end / OPEN_SCALE) ** tt;
  // From the terminal on its point to the bounds' centre on the region's, in step with the scale: no swerve.
  const k = OPEN_SCALE !== end ? (1 - OPEN_SCALE / scale) / (1 - OPEN_SCALE / end) : 1;
  const open = CONE_AT(view);
  const px = lerp(0, (bounds.minX + bounds.maxX) / 2, k);
  const pz = lerp(0, (bounds.minZ + bounds.maxZ) / 2, k);
  const ax = lerp(open.x, (r.left + r.right) / 2, k);
  const ay = lerp(open.y, (r.top + r.bottom) / 2, k);
  return { scale, origin: { x: ax - px * scale, y: ay - pz * scale } };
}
