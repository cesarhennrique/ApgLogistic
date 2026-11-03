import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PE_BA_BOUNDS, SALVADOR_AT } from "../stages/distributionCamera";
import { DELIVERIES, SALVADOR, deliveryAt, routeWindow, toSvg } from "./distributionLayout";
import { parseStates, toHero } from "./heroMapLayout";

// The two states' outlines, in the SVG's own units (scripts/clean-map.mjs: x = (lon + 49) * 100, y = (2 - lat) * 100).
const svg = readFileSync("public/images/map/nordeste.svg", "utf8");
function rings(uf: string): [number, number][][] {
  const d = new RegExp(`<path id="${uf}" d="([^"]+)"`).exec(svg)![1];
  return d
    .split("Z")
    .filter((r) => r.trim())
    .map((r) => [...r.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as [number, number]));
}
function inside([x, y]: [number, number], polygons: [number, number][][]) {
  let hit = false;
  for (const ring of polygons) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}
const pe = rings("PE");
const ba = rings("BA");

describe("the deliveries", () => {
  it("are 24, three per coverage route in site.ts, each from its hub", () => {
    expect(DELIVERIES).toHaveLength(24);
    expect(new Set(DELIVERIES.map((d) => `${d.to.x.toFixed(2)},${d.to.z.toFixed(2)}`)).size).toBe(24);
    // Suape is the map's origin
    expect(DELIVERIES[0].from).toEqual({ x: 0, z: 0 });
  });

  it("all end inside Pernambuco or Bahia", () => {
    for (const d of DELIVERIES) {
      const p = toSvg(d.to);
      expect(inside(p, pe) || inside(p, ba), `(${p.join(", ")})`).toBe(true);
    }
  });

  it("branch out one after another: Salvador's only once the line has reached Salvador, all by 90%", () => {
    const trunk = DELIVERIES.findIndex((d) => d.trunk);
    const [, trunkEnd] = routeWindow(trunk);
    DELIVERIES.forEach((d, i) => {
      const [start, end] = routeWindow(i);
      expect(end).toBeLessThanOrEqual(0.9);
      if (d.hub === "Salvador") expect(start).toBeGreaterThanOrEqual(trunkEnd);
      if (i > 0) expect(start).toBeGreaterThan(routeWindow(i - 1)[0]);
    });
  });

  it("counts the deliveries lit at a progress", () => {
    expect(deliveryAt(0)).toBe(0);
    expect(deliveryAt(1)).toBe(24);
    expect(deliveryAt(0.5)).toBeGreaterThan(0);
    expect(deliveryAt(0.5)).toBeLessThan(24);
  });
});

describe("the camera's map numbers", () => {
  it("are Salvador's hub", () => {
    expect(SALVADOR_AT.x).toBeCloseTo(SALVADOR.x, 1);
    expect(SALVADOR_AT.z).toBeCloseTo(SALVADOR.z, 1);
  });

  it("are PE and BA's extents on the SVG", () => {
    const s = parseStates(svg);
    const pts = [...s.PE, ...s.BA].flat().map(([x, y]) => toHero(x, y));
    expect(PE_BA_BOUNDS.minX).toBeCloseTo(Math.min(...pts.map((p) => p.x)), 1);
    expect(PE_BA_BOUNDS.maxX).toBeCloseTo(Math.max(...pts.map((p) => p.x)), 1);
    expect(PE_BA_BOUNDS.minZ).toBeCloseTo(Math.min(...pts.map((p) => p.z)), 1);
    expect(PE_BA_BOUNDS.maxZ).toBeCloseTo(Math.max(...pts.map((p) => p.z)), 1);
  });
});
