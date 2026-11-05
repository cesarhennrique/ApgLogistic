import { site } from "@/content/site";
import { HERO_SCALE, toHero } from "./mapUnits";

// Scene 5, the distribution, on the hero's map (heroMapLayout's units: Suape, the CONE terminal's point, at the
// origin, north toward -Z): from its hubs, Suape and Salvador, 24 deliveries, three per coverage route in site.ts
// (the route's town and two points nearby, chosen so all 24 fall inside PE or BA, tested against the SVG).
const svgOf = (lon: number, lat: number): [number, number] => [(lon + 49) * 100, (2 - lat) * 100];
const [suapeX, suapeY] = svgOf(site.home.coverage.hubs[0].lon, site.home.coverage.hubs[0].lat);

export const toSvg = (p: { x: number; z: number }): [number, number] => [suapeX + p.x / HERO_SCALE, suapeY + p.z / HERO_SCALE];

const NUDGES: [number, number][] = [
  [0, 0],
  [-0.35, 0.12],
  [-0.3, -0.15],
];
const HUBS = Object.fromEntries(site.home.coverage.hubs.map((h) => [h.label, toHero(...svgOf(h.lon, h.lat))]));
export const SALVADOR = HUBS.Salvador;

// In order of departure: Suape's, then Salvador's. The trunk is Suape's route onto Salvador itself.
export const DELIVERIES = site.home.coverage.routes
  .flatMap((r) =>
    NUDGES.map(([dLon, dLat], n) => {
      const to = toHero(...svgOf(r.lon + dLon, r.lat + dLat));
      return { hub: r.from, from: HUBS[r.from], to, trunk: n === 0 && Math.hypot(to.x - SALVADOR.x, to.z - SALVADOR.z) < 1e-6 };
    }),
  )
  .sort((a, b) => (a.hub === b.hub ? 0 : a.hub === "Suape" ? -1 : 1));

// When each is drawn (over the scene's progress after its slide): Suape's from 20%, one after another; Salvador's
// once the trunk has reached Salvador; each line taking 16%.
const DRAW = 0.16;
const suapeCount = DELIVERIES.filter((d) => d.hub === "Suape").length;
const trunkEnd = 0.2 + DELIVERIES.findIndex((d) => d.trunk) * 0.015 + DRAW;
export function routeWindow(i: number): [number, number] {
  const start = i < suapeCount ? 0.2 + i * 0.015 : trunkEnd + (i - suapeCount) * 0.018;
  return [start, start + DRAW];
}

// How many deliveries have arrived at the progress c.
export const deliveryAt = (c: number) => DELIVERIES.filter((_, i) => c >= routeWindow(i)[1]).length;
