import { describe, expect, it } from "vitest";
import { CRANE_POSITION, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "../anchors";
import { SCENE_POSITIONS } from "../camera-path";
import { CONTAINER } from "./containerGeometry";
import { buildStacks, STACKS, type StackedContainer } from "./stackLayout";

type Box = { min: number[]; max: number[] };

function bounds(c: StackedContainer): Box {
  const { length, width, height } = CONTAINER[c.type];
  const [x, y, z] = c.position;
  // A quarter turn swaps length and width.
  const [lx, lz] = c.rotated ? [length, width] : [width, length];
  return { min: [x - lx / 2, y, z - lz / 2], max: [x + lx / 2, y + height, z + lz / 2] };
}

const overlap = (a: Box, b: Box, eps = 0.01) =>
  [0, 1, 2].every((i) => a.min[i] < b.max[i] - eps && b.min[i] < a.max[i] - eps);

describe("STACKS", () => {
  it("fits in 400 instances", () => {
    expect(STACKS.length).toBeGreaterThan(100);
    expect(STACKS.length).toBeLessThanOrEqual(400);
  });

  it("never puts two boxes in the same space", () => {
    const b = STACKS.map(bounds);
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) expect(overlap(b[i], b[j])).toBe(false);
  });

  it("rests every box on the base or squarely on another box", () => {
    for (const c of STACKS) {
      if (c.tier === 0) continue;
      const below = STACKS.find(
        (o) =>
          o.tier === c.tier - 1 &&
          Math.abs(o.position[0] - c.position[0]) < 0.01 &&
          Math.abs(o.position[2] - c.position[2]) < 0.01,
      );
      expect(below, `tier ${c.tier} at ${c.position.join(",")}`).toBeDefined();
      expect(c.position[1]).toBeCloseTo(below!.position[1] + CONTAINER[below!.type].height, 6);
    }
  });

  it("keeps the crane's truck lane clear", () => {
    const lane: Box = {
      min: [TRUCK_LOAD_POINT.x - 3, 0, CRANE_POSITION.z - 12],
      max: [TRUCK_LOAD_POINT.x + 3, 60, CRANE_POSITION.z + 12],
    };
    for (const c of STACKS) expect(overlap(bounds(c), lane)).toBe(false);
  });

  it("fills the port and the CONE terminal, with APG boxes in each", () => {
    for (const area of ["port", "terminal"] as const) {
      const here = STACKS.filter((c) => c.area === area);
      expect(here.length).toBeGreaterThan(20);
      expect(here.some((c) => c.apg)).toBe(true);
    }
    const [tx, , tz] = SCENE_POSITIONS.terminal;
    for (const c of STACKS.filter((s) => s.area === "terminal")) {
      expect(Math.abs(c.position[0] - tx)).toBeLessThan(60);
      expect(Math.abs(c.position[2] - tz)).toBeLessThan(60);
    }
  });

  it("leaves the crane's box slot free on a 40' tier below it", () => {
    const at = (y: number) =>
      STACKS.filter(
        (c) =>
          Math.abs(c.position[0] - SHIP_PICK_POINT.x) < 0.01 &&
          Math.abs(c.position[1] - y) < 0.01 &&
          Math.abs(c.position[2] - SHIP_PICK_POINT.z) < 0.01,
      );
    expect(at(SHIP_PICK_POINT.y)).toHaveLength(0);
    expect(at(SHIP_PICK_POINT.y - CONTAINER["40"].height).map((c) => c.type)).toEqual(["40"]);
  });

  it("is deterministic, so screenshots stay stable", () => {
    expect(buildStacks()).toEqual(STACKS);
  });
});
