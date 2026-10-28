import { describe, expect, it } from "vitest";
import { CRANE_POSITION, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "./anchors";
import { HOIST_TOP, LOCK_AT, craneState } from "./craneMotion";
import { CONTAINER } from "./models/containerGeometry";

const H = CONTAINER["40"].height;

describe("craneState", () => {
  it("starts parked over the truck lane, spreader up, the box still on the ship", () => {
    const s = craneState(0);
    expect(s.trolleyX).toBeCloseTo(TRUCK_LOAD_POINT.x, 6);
    expect(s.spreaderY).toBeCloseTo(HOIST_TOP, 6);
    expect(s.container.distanceTo(SHIP_PICK_POINT)).toBeLessThan(1e-6);
    expect(s.locked).toBe(false);
  });

  it("locks onto the box over the ship at 0.15", () => {
    expect(LOCK_AT).toBe(0.15);
    const s = craneState(0.15);
    expect(s.trolleyX).toBeCloseTo(SHIP_PICK_POINT.x, 6);
    expect(s.spreaderY).toBeCloseTo(SHIP_PICK_POINT.y + H, 6);
    expect(s.locked).toBe(true);
    expect(craneState(0.149).locked).toBe(false);
  });

  it("carries the box hanging under the spreader once it lifts", () => {
    const s = craneState(0.25);
    expect(s.container.y).toBeCloseTo(s.spreaderY - H, 6);
    expect(s.container.x).toBeCloseTo(s.trolleyX, 6);
  });

  it("has the box in the air, crossing, at 0.3", () => {
    const s = craneState(0.3);
    expect(s.container.y).toBeGreaterThan(SHIP_PICK_POINT.y + 5);
    expect(s.container.x).toBeGreaterThan(SHIP_PICK_POINT.x + 1);
    expect(s.container.x).toBeLessThan(TRUCK_LOAD_POINT.x - 1);
  });

  it("crosses the portal's side frames above their 12 m sill beams", () => {
    const sillTop = CRANE_POSITION.y + 12 + 0.35;
    for (let p = 0.26; p <= 0.34; p += 0.001) expect(craneState(p).container.y).toBeGreaterThan(sillTop);
  });

  it("sets the box down exactly on TRUCK_LOAD_POINT at the end of 'load' and leaves it there", () => {
    for (const p of [0.4, 0.7, 1]) expect(craneState(p).container.distanceTo(TRUCK_LOAD_POINT)).toBeLessThan(1e-6);
  });

  it("never jumps: under 0.5 m between t and t + 0.001", () => {
    let last = craneState(0);
    let prev = { x: last.trolleyX, y: last.spreaderY, c: last.container.clone() };
    for (let i = 1; i <= 1000; i++) {
      last = craneState(i / 1000);
      expect(Math.abs(last.trolleyX - prev.x)).toBeLessThan(0.5);
      expect(Math.abs(last.spreaderY - prev.y)).toBeLessThan(0.5);
      expect(last.container.distanceTo(prev.c)).toBeLessThan(0.5);
      prev = { x: last.trolleyX, y: last.spreaderY, c: last.container.clone() };
    }
  });
});
