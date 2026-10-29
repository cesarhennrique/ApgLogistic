import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HERO_ROUTES, buildDots, parseStates, toHero } from "./heroMapLayout";

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
      expect(route.getPoint(0.5).y).toBeGreaterThan(3);
    }
  });
});
