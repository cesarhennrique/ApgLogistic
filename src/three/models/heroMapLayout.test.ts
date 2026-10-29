import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { HERO_BOUNDS, HERO_HULL, HERO_ROUTES, buildDots, parseStates, toHero } from "./heroMapLayout";

const svg = readFileSync("public/images/map/nordeste.svg", "utf8");
const states = parseStates(svg);

function inside(x: number, y: number, rings: [number, number][][]) {
  let hit = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  return hit;
}

describe("hero map", () => {
  it("reads the nine Northeast states from the SVG", () => {
    expect(Object.keys(states).sort()).toEqual(["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"]);
  });

  it("puts Suape at the origin, north toward -Z, east toward +X", () => {
    const suape = toHero(1404, 1039);
    expect(Math.hypot(suape.x, suape.z)).toBeLessThan(0.1);
    const north = toHero(1404, 900);
    const east = toHero(1500, 1039);
    expect(north.z).toBeLessThan(0);
    expect(east.x).toBeGreaterThan(0);
  });

  it("fills the states with a dot grid, and only the states", () => {
    const { positions, count } = buildDots(states);
    expect(count).toBeGreaterThan(2000);
    for (let i = 0; i < count; i += 37) {
      const [sx, sy] = [positions[i * 3], positions[i * 3 + 2]];
      const svgX = sx / 0.05 + 1404;
      const svgY = sy / 0.05 + 1039;
      expect(Object.values(states).some((rings) => inside(svgX, svgY, rings))).toBe(true);
    }
  });

  it("brings five cabotage routes in from the sea, each ending on Suape", () => {
    expect(HERO_ROUTES).toHaveLength(5);
    for (const route of HERO_ROUTES) {
      const start = route.getPoint(0);
      const end = route.getPoint(1);
      expect(Math.hypot(end.x, end.y, end.z)).toBeLessThan(1e-6);
      // Offshore: east of the coast, outside every state.
      expect(start.x).toBeGreaterThan(5);
      const svgX = start.x / 0.05 + 1404;
      const svgY = start.z / 0.05 + 1039;
      expect(Object.values(states).some((rings) => inside(svgX, svgY, rings))).toBe(false);
      // An arc: it rises above the map between the ends.
      expect(route.getPoint(0.5).y).toBeGreaterThan(1.5);
    }
  });

  it("bounds every state and every route, for the camera to fit", () => {
    const bounds = HERO_BOUNDS.clone().expandByScalar(1e-6);
    for (const rings of Object.values(states))
      for (const ring of rings)
        for (const [x, y] of ring) {
          const p = toHero(x, y);
          expect(bounds.containsPoint(new Vector3(p.x, 0, p.z))).toBe(true);
        }
    for (const route of HERO_ROUTES) for (const p of route.getPoints(32)) expect(bounds.containsPoint(p)).toBe(true);
  });

  it("wraps every state point in its convex hull", () => {
    // Counter-clockwise in (x, z) or clockwise: every point on the same side of every edge.
    const sign = (a: Vector3, b: Vector3, x: number, z: number) => (b.x - a.x) * (z - a.z) - (b.z - a.z) * (x - a.x);
    const n = HERO_HULL.length;
    const orientation = Math.sign(sign(HERO_HULL[0], HERO_HULL[1], HERO_HULL[2].x, HERO_HULL[2].z));
    for (const rings of Object.values(states))
      for (const ring of rings)
        for (const [x, y] of ring) {
          const p = toHero(x, y);
          for (let i = 0; i < n; i++) expect(sign(HERO_HULL[i], HERO_HULL[(i + 1) % n], p.x, p.z) * orientation).toBeGreaterThanOrEqual(-1e-6);
        }
  });
});
