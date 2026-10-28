import { MathUtils } from "three";
import { site } from "@/content/site";

// The 'distribution' map: Pernambuco and Bahia from public/images/map/nordeste.svg, laid flat on the ground.
// SVG units are the IBGE projection of scripts/clean-map.mjs (x = (lon + 49) * 100, y = (2 - lat) * 100,
// 1 unit = 0.01°). One unit is MAP_SCALE meters; north is -Z and east +X, so seen from above with -Z up it reads
// as a map (not mirrored); Suape sits at MAP_ORIGIN.
export const MAP_SCALE = 0.12;
export const MAP_ORIGIN = { x: 55, z: -365 };
// The map's top (extruded states) above the ground.
export const MAP_TOP = 0.6;

const svgOf = (lon: number, lat: number): [number, number] => [(lon + 49) * 100, (2 - lat) * 100];
const suape = site.home.coverage.hubs[0];
const [suapeX, suapeY] = svgOf(suape.lon, suape.lat);

export function toMap(svgX: number, svgY: number) {
  return { x: MAP_ORIGIN.x + (svgX - suapeX) * MAP_SCALE, z: MAP_ORIGIN.z + (svgY - suapeY) * MAP_SCALE };
}

export function toSvg(p: { x: number; z: number }): [number, number] {
  return [suapeX + (p.x - MAP_ORIGIN.x) / MAP_SCALE, suapeY + (p.z - MAP_ORIGIN.z) / MAP_SCALE];
}

// The distribution warehouse stands at Suape; the vans come out of its door.
export const GALPAO_DOOR = toMap(suapeX, suapeY);

// Three drops per coverage route (site.ts): the route's town and two points nearby (degrees), chosen so all 24
// fall inside PE or BA (tested against the SVG's outlines).
const NUDGES: [number, number][] = [
  [0, 0],
  [-0.35, 0.12],
  [-0.3, -0.15],
];
export const SALVADOR = toMap(...svgOf(site.home.coverage.hubs[1].lon, site.home.coverage.hubs[1].lat));

export const VAN_DESTINATIONS = site.home.coverage.routes.flatMap((r) =>
  NUDGES.map(([dLon, dLat]) => toMap(...svgOf(r.lon + dLon, r.lat + dLat))),
);

// Leave one after another over the first 40% of the chapter, each drive taking 55% of it.
const STAGGER = 0.4;
const DRIVE = 0.55;
// How far each curve bows out to the side (alternating), as a share of its length: the fan.
const BOW = 0.2;

export type VanState = { x: number; z: number; heading: number; visible: boolean };

// Where van i is at chapter-local progress u (0–1): a quadratic curve from the door to its drop.
export function vanStateAt(i: number, u: number, out: VanState = { x: 0, z: 0, heading: 0, visible: false }): VanState {
  const start = GALPAO_DOOR;
  const end = VAN_DESTINATIONS[i];
  const leaveAt = (STAGGER * i) / (VAN_DESTINATIONS.length - 1);
  const t = MathUtils.smoothstep((u - leaveAt) / DRIVE, 0, 1);
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const side = (i % 2 ? 1 : -1) * BOW;
  const cx = (start.x + end.x) / 2 - dz * side;
  const cz = (start.z + end.z) / 2 + dx * side;
  const a = (1 - t) * (1 - t);
  const b = 2 * (1 - t) * t;
  const c = t * t;
  out.x = a * start.x + b * cx + c * end.x;
  out.z = a * start.z + b * cz + c * end.z;
  // Tangent of the curve (its direction at t), for the van's heading about Y.
  const tx = 2 * (1 - t) * (cx - start.x) + 2 * t * (end.x - cx);
  const tz = 2 * (1 - t) * (cz - start.z) + 2 * t * (end.z - cz);
  out.heading = Math.atan2(tx, tz);
  out.visible = u > leaveAt;
  return out;
}
