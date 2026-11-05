import { site } from "@/content/site";

// The hero's map units (no three.js: the still maps use them too), from public/images/map/nordeste.svg
// (scripts/clean-map.mjs projection: x = (lon + 49) * 100, y = (2 - lat) * 100). One SVG unit is HERO_SCALE units;
// Suape sits at the origin, north toward -Z, east toward +X (the same orientation as the distribution map).
export const HERO_SCALE = 0.05;

export const svgOf = (lon: number, lat: number): [number, number] => [(lon + 49) * 100, (2 - lat) * 100];
export const [SUAPE_SVG_X, SUAPE_SVG_Y] = svgOf(site.home.coverage.hubs[0].lon, site.home.coverage.hubs[0].lat);

export function toHero(svgX: number, svgY: number) {
  return { x: (svgX - SUAPE_SVG_X) * HERO_SCALE, z: (svgY - SUAPE_SVG_Y) * HERO_SCALE };
}

export const SALVADOR_HERO = toHero(...svgOf(site.home.coverage.hubs[1].lon, site.home.coverage.hubs[1].lat));

// nordeste.svg's viewBox (SVG units).
export const MAP_VIEWBOX = { x: 24.5, y: 305.3, w: 1395.2, h: 1728.4 };

// Five cabotage routes arriving from the sea (east of Suape), arcing low over the water down onto Suape. They
// start close enough to stay inside the hero's frame. Bearings from east (degrees, negative = north) and
// distances offshore (map units).
export const ROUTE_STARTS: [number, number][] = [
  [-58, 11],
  [-30, 9],
  [-4, 12],
  [22, 9],
  [48, 11],
];
