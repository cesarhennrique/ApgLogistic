import { QuadraticBezierCurve3, Vector3 } from "three";
import { site } from "@/content/site";

// The hero's map of the Northeast, from public/images/map/nordeste.svg (scripts/clean-map.mjs projection:
// x = (lon + 49) * 100, y = (2 - lat) * 100). One SVG unit is HERO_SCALE units; Suape sits at the origin,
// north toward -Z, east toward +X (the same orientation as the distribution map).
export const HERO_SCALE = 0.05;

const svgOf = (lon: number, lat: number): [number, number] => [(lon + 49) * 100, (2 - lat) * 100];
const [suapeX, suapeY] = svgOf(site.home.coverage.hubs[0].lon, site.home.coverage.hubs[0].lat);

export function toHero(svgX: number, svgY: number) {
  return { x: (svgX - suapeX) * HERO_SCALE, z: (svgY - suapeY) * HERO_SCALE };
}

export const SALVADOR_HERO = toHero(...svgOf(site.home.coverage.hubs[1].lon, site.home.coverage.hubs[1].lat));

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

// Five cabotage routes arriving from the sea (east of Suape), arcing over the water down onto Suape.
// Bearings from east (degrees, negative = north) and distances offshore.
const ROUTE_STARTS: [number, number][] = [
  [-58, 19],
  [-30, 16],
  [-4, 20],
  [22, 15],
  [48, 19],
];
export const HERO_ROUTES = ROUTE_STARTS.map(([bearing, distance], i) => {
  const a = (bearing * Math.PI) / 180;
  const start = new Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance);
  const control = start.clone().multiplyScalar(0.5).setY(7 + (i % 3) * 2);
  return new QuadraticBezierCurve3(start, control, new Vector3(0, 0, 0));
});
