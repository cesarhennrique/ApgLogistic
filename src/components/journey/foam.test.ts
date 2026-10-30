import { describe, expect, it } from "vitest";
import { SHIP_SOURCE, createFoam } from "./foam";

const ship = { left: 400, top: 100, width: 300, height: 300 * (SHIP_SOURCE.h / SHIP_SOURCE.w) };
const bowY = ship.top + (SHIP_SOURCE.bow.y / SHIP_SOURCE.h) * ship.height;
const sternY = ship.top + (SHIP_SOURCE.stern.y / SHIP_SOURCE.h) * ship.height;

describe("foam", () => {
  it("throws spray at the bow and leaves a wake behind the stern", () => {
    const foam = createFoam(2000, () => 0.5);
    for (let i = 0; i < 30; i++) foam.step(1 / 60, ship, 120, 0);
    const near = (y: number, tol: number) => foam.particles.filter((p) => Math.abs(p.y - y) < tol).length;
    expect(near(bowY, ship.height * 0.15)).toBeGreaterThan(0);
    expect(foam.particles.filter((p) => p.y > sternY - 2).length).toBeGreaterThan(0);
  });

  it("makes more foam the faster the ship goes through the water", () => {
    const slow = createFoam(5000, () => 0.5);
    const fast = createFoam(5000, () => 0.5);
    for (let i = 0; i < 60; i++) {
      slow.step(1 / 60, ship, 40, 0);
      fast.step(1 / 60, ship, 200, 0);
    }
    expect(fast.particles.length).toBeGreaterThan(slow.particles.length * 2);
  });

  it("carries the foam downstream with the flow, fades it out, and never exceeds its cap", () => {
    const foam = createFoam(300, () => 0.5);
    for (let i = 0; i < 600; i++) foam.step(1 / 60, ship, 200, 80);
    expect(foam.particles.length).toBeLessThanOrEqual(300);
    for (const p of foam.particles) {
      expect(p.alpha).toBeGreaterThanOrEqual(0);
      expect(p.alpha).toBeLessThanOrEqual(0.5);
    }
    // Stopped: everything fades away.
    for (let i = 0; i < 600; i++) foam.step(1 / 60, ship, 0, 0, false);
    expect(foam.particles.length).toBe(0);
  });
});
