// The ship's foam, seen from above (scene 1): spray off the bow in a V, a wash along the sides and the wake behind
// the stern. Particles live in screen px; the canvas only draws them (OceanArrival).

// navio-cima, in source px: the bow's tip, where the bow flare reaches full beam, the hull's sides and the stern.
export const SHIP_SOURCE = {
  w: 941,
  h: 1672,
  bow: { x: 471, y: 31 },
  flareY: 231,
  hull: [274, 669] as const,
  stern: { y: 1635, x: [332, 611] as const },
};

export type Particle = { x: number; y: number; vx: number; vy: number; size: number; alpha: number; a0: number; life: number; life0: number };
export type ShipBox = { left: number; top: number; width: number; height: number };

// Spawn per second at a through-water speed of one ship length per second, scaled by the actual speed.
const RATE = { bow: 3200, sides: 900, stern: 2600 };

export function createFoam(max = 3000, random: () => number = Math.random) {
  const particles: Particle[] = [];
  const r = (a: number, b: number) => a + (b - a) * random();

  function spawn(x: number, y: number, vx: number, vy: number, size: number, alpha: number, life: number) {
    particles.push({ x, y, vx, vy, size, alpha: 0, a0: alpha, life, life0: life });
    if (particles.length > max) particles.shift();
  }

  // Advance by dt seconds. speed: the ship through the water (px/s); flow: the water moving down the screen
  // (px/s, the camera following the ship). emit=false only lets what's there fade.
  function step(dt: number, ship: ShipBox, speed: number, flow: number, emit = true) {
    const sx = (x: number) => ship.left + (x / SHIP_SOURCE.w) * ship.width;
    const sy = (y: number) => ship.top + (y / SHIP_SOURCE.h) * ship.height;
    // Speeds in px/s for a hull ~170 px wide on screen; sizes in px for the same hull.
    const hullWidth = ((SHIP_SOURCE.hull[1] - SHIP_SOURCE.hull[0]) / SHIP_SOURCE.w) * ship.width;
    const unit = hullWidth / 170;
    const grain = hullWidth / 100;
    const k = speed / ship.height; // ship lengths per second

    if (emit && k > 0) {
      const count = (rate: number) => {
        const n = rate * k * dt;
        return Math.floor(n) + (random() < n % 1 ? 1 : 0);
      };
      // Bow: along both edges of the flare, thrown outward and back.
      for (let i = count(RATE.bow); i > 0; i--) {
        const side = random() < 0.5 ? -1 : 1;
        const t = random();
        const x = SHIP_SOURCE.bow.x + (SHIP_SOURCE.hull[side < 0 ? 0 : 1] - SHIP_SOURCE.bow.x) * t;
        const y = SHIP_SOURCE.bow.y + (SHIP_SOURCE.flareY - SHIP_SOURCE.bow.y) * t;
        spawn(sx(x) + side * r(0, 6) * unit, sy(y), side * r(15, 45) * unit, r(5, 25) * unit, r(1.5, 4) * grain, r(0.3, 0.55), r(0.8, 1.8));
      }
      // Sides: a thin wash peeling off the hull.
      for (let i = count(RATE.sides); i > 0; i--) {
        const side = random() < 0.5 ? -1 : 1;
        const y = r(SHIP_SOURCE.flareY, SHIP_SOURCE.stern.y);
        spawn(sx(SHIP_SOURCE.hull[side < 0 ? 0 : 1]) + side * r(2, 8) * unit, sy(y), side * r(5, 15) * unit, r(0, 15) * unit, r(1.2, 3) * grain, r(0.2, 0.35), r(1, 2));
      }
      // Stern: the churned wake, spreading slowly behind.
      for (let i = count(RATE.stern); i > 0; i--) {
        const x = r(SHIP_SOURCE.stern.x[0], SHIP_SOURCE.stern.x[1]);
        spawn(sx(x), sy(SHIP_SOURCE.stern.y) + r(0, 10) * unit, r(-20, 20) * unit, r(10, 40) * unit, r(2, 5) * grain, r(0.25, 0.45), r(2, 4));
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += (p.vy + flow) * dt;
      p.vx *= 1 - 1.4 * dt;
      p.vy *= 1 - 0.8 * dt;
      p.size *= 1 + 0.25 * dt;
      // A quick fade in, then out slowly over the rest of its life.
      const age = 1 - p.life / p.life0;
      p.alpha = p.a0 * Math.min(age / 0.08, 1) * (1 - age) ** 1.5;
    }
  }

  return { particles, step };
}
