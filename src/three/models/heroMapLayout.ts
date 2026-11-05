import { Box3, QuadraticBezierCurve3, Vector3 } from "three";
import { ROUTE_STARTS, toHero } from "./mapUnits";

// The hero's map of the Northeast (its units: mapUnits).
export { HERO_SCALE, SALVADOR_HERO, toHero } from "./mapUnits";

type Ring = [number, number][];

// Each state's outline rings (SVG units), from the cleaned SVG's absolute M/L/Z paths.
export function parseStates(svg: string): Record<string, Ring[]> {
  const out: Record<string, Ring[]> = {};
  for (const [, id, d] of svg.matchAll(/<path id="([A-Z]{2})" d="([^"]+)"/g)) {
    out[id] = d
      .split("Z")
      .filter((r) => r.trim())
      .map((r) => [...r.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]));
  }
  return out;
}

function inside(x: number, y: number, rings: Ring[]) {
  let hit = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  return hit;
}

// The dot grid inside the states (linear colors on navy): PE and BA in the coverage map's two sand tones,
// the rest dim.
const TONES: Record<string, [number, number, number]> = {
  PE: [0.9, 0.86, 0.8],
  BA: [0.62, 0.57, 0.48],
};
const DIM: [number, number, number] = [0.16, 0.15, 0.14];

export function buildDots(states: Record<string, Ring[]>, spacing = 14) {
  const positions: number[] = [];
  const colors: number[] = [];
  for (const [id, rings] of Object.entries(states)) {
    const xs = rings.flat().map((p) => p[0]);
    const ys = rings.flat().map((p) => p[1]);
    // On one global grid, so neighboring states line up.
    for (let x = Math.ceil(Math.min(...xs) / spacing) * spacing; x <= Math.max(...xs); x += spacing) {
      for (let y = Math.ceil(Math.min(...ys) / spacing) * spacing; y <= Math.max(...ys); y += spacing) {
        if (!inside(x, y, rings)) continue;
        const p = toHero(x, y);
        positions.push(p.x, 0, p.z);
        colors.push(...(TONES[id] ?? DIM));
      }
    }
  }
  return { positions: new Float32Array(positions), colors: new Float32Array(colors), count: positions.length / 3 };
}

// The five cabotage routes (mapUnits' ROUTE_STARTS) arcing low over the water down onto Suape.
export const HERO_ROUTES = ROUTE_STARTS.map(([bearing, distance], i) => {
  const a = (bearing * Math.PI) / 180;
  const start = new Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance);
  const control = start.clone().multiplyScalar(0.5).setY(3.5 + (i % 3));
  return new QuadraticBezierCurve3(start, control, new Vector3(0, 0, 0));
});

// The map's convex hull (SVG units, from the cleaned SVG): what the hero's camera fits, tighter than the box.
const HULL_SVG: [number, number][] = [
  [24.5, 734.9], [283.8, 328.2], [289.6, 320.2], [300.5, 305.3], [314.6, 305.3], [403.4, 327.1], [905.8, 486.6],
  [1351.1, 715.7], [1361.8, 727], [1374.4, 751.7], [1377.3, 761.2], [1403.2, 848.7], [1415.8, 905.6],
  [1419.4, 924.5], [1419.7, 938.8], [1417.2, 995.9], [1403.9, 1036.7], [1389.7, 1078.5], [1387, 1086.2],
  [1384.7, 1091.4], [986.3, 1968.5], [933.2, 2033.7], [292.3, 1726.5],
];
export const HERO_HULL = HULL_SVG.map(([x, y]) => {
  const p = toHero(x, y);
  return new Vector3(p.x, 0, p.z);
});

// The SVG's extents (its viewBox) and the routes, in hero units.
const SVG_MIN = toHero(24.5, 305.3);
const SVG_MAX = toHero(1419.7, 2033.7);
export const HERO_BOUNDS = new Box3(new Vector3(SVG_MIN.x, 0, SVG_MIN.z), new Vector3(SVG_MAX.x, 0, SVG_MAX.z));
for (const route of HERO_ROUTES) for (const p of route.getPoints(16)) HERO_BOUNDS.expandByPoint(p);
