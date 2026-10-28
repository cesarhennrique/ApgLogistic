import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GALPAO_DOOR, VAN_DESTINATIONS, toMap, toSvg, vanStateAt } from "./distributionLayout";

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

describe("VAN_DESTINATIONS", () => {
  it("sends 24 vans, three per coverage route in site.ts", () => {
    expect(VAN_DESTINATIONS).toHaveLength(24);
    expect(new Set(VAN_DESTINATIONS.map((d) => `${d.x.toFixed(2)},${d.z.toFixed(2)}`)).size).toBe(24);
  });

  it("puts every destination inside Pernambuco or Bahia", () => {
    for (const d of VAN_DESTINATIONS) {
      const p = toSvg(d);
      expect(inside(p, pe) || inside(p, ba), `(${p.join(", ")})`).toBe(true);
    }
  });

  it("round-trips between the map's world coordinates and the SVG's", () => {
    const [x, y] = toSvg(toMap(1000, 1500));
    expect(x).toBeCloseTo(1000, 6);
    expect(y).toBeCloseTo(1500, 6);
  });
});

describe("vanStateAt", () => {
  it("keeps every van inside the warehouse (hidden) before the chapter starts", () => {
    for (let i = 0; i < 24; i++) {
      const s = vanStateAt(i, 0);
      expect(s.visible).toBe(false);
      expect(Math.hypot(s.x - GALPAO_DOOR.x, s.z - GALPAO_DOOR.z)).toBeLessThan(1e-6);
    }
  });

  it("has every van at its destination by the end", () => {
    VAN_DESTINATIONS.forEach((d, i) => {
      const s = vanStateAt(i, 1);
      expect(Math.hypot(s.x - d.x, s.z - d.z)).toBeLessThan(1e-6);
    });
  });

  it("fans out: the vans leave one after another, never all at once", () => {
    const out = (u: number) => Array.from({ length: 24 }, (_, i) => vanStateAt(i, u).visible).filter(Boolean).length;
    expect(out(0.1)).toBeGreaterThan(0);
    expect(out(0.1)).toBeLessThan(24);
    expect(out(0.5)).toBe(24);
  });

  it("drives smoothly: under 1 m between u and u + 0.001", () => {
    for (let i = 0; i < 24; i += 5) {
      let last = vanStateAt(i, 0);
      for (let u = 0.001; u <= 1; u += 0.001) {
        const s = vanStateAt(i, u);
        expect(Math.hypot(s.x - last.x, s.z - last.z)).toBeLessThan(1);
        last = s;
      }
    }
  });
});
