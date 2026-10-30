import { CRANE_POSITION, QUAY_TOP, SHIP_DECK_Y, SHIP_PICK_POINT } from "../anchors";
import { CONTAINER, type ContainerType } from "./containerGeometry";

export type StackedContainer = {
  type: ContainerType;
  area: "port" | "ship" | "terminal";
  // Index of its stack block: one instanced mesh per block, so the renderer culls block by block.
  block: number;
  // Bottom center, in meters.
  position: [number, number, number];
  // Quarter turn about Y (length along X). Unused by the current blocks, kept explicit for the tests.
  rotated: boolean;
  tier: number;
  color: string;
  apg: boolean;
  // In the block's camera-facing front slot (row toward the chapter's camera, first bay).
  front: boolean;
};

// Eight matte carrier tones, distinct enough to read at dusk (no logos): rust, ocean blue, petrol, ochre,
// green, grey, ice white, wine.
export const CARRIER_COLORS = ["#9c3b2e", "#2e5e8c", "#2f7a78", "#c08a2e", "#3f6b45", "#8a8f96", "#d9d6cf", "#6e2a35"];

// APG navy; the red stripe is its own mesh.
export const APG_NAVY = "#1a2350";

type Block = {
  area: StackedContainer["area"];
  // Center of the first slot (row 0, bay 0) and the base height.
  x: number;
  z: number;
  base: number;
  rows: number; // across X
  bays: number; // 40' slots along -Z
  maxTier: number;
  apgShare: number;
  // The row the chapter's camera sees first: its first bay is topped with an APG box.
  frontRow: "first" | "last";
  minTier?: number;
  // Slots left empty (by row, bay, tier): the crane's working slot on the ship.
  skip?: (row: number, bay: number, tier: number) => boolean;
};

const ROW_PITCH = CONTAINER["40"].width + 0.3;
const BAY_PITCH = CONTAINER["40"].length + 0.6;

// The terminal's blocks in its stage's own frame (around the origin); port and ship blocks use the port anchors.
const tx = 0;
const tz = 0;

const BLOCKS: Block[] = [
  // The ship's deck: 7 bays of 7 rows, 3–4 high. The aft-most bay's quay-side column stops below the box the
  // crane picks (its fourth tier).
  ...Array.from({ length: 7 }, (_, k) => ({
    area: "ship" as const,
    x: SHIP_PICK_POINT.x - 6 * ROW_PITCH,
    z: SHIP_PICK_POINT.z - k * BAY_PITCH,
    base: SHIP_DECK_Y,
    rows: 7,
    bays: 1,
    minTier: 3,
    maxTier: 4,
    apgShare: 0.12,
    // The crane shot looks from the sea side.
    frontRow: "first" as const,
    skip: k === 0 ? (row: number, _bay: number, tier: number) => row === 6 && tier >= 3 : undefined,
  })),
  // Port stacks on the quay, inland of the crane's land legs and past it, so the crane shots look at it clear.
  { area: "port", x: CRANE_POSITION.x + 20, z: CRANE_POSITION.z - 18, base: QUAY_TOP, rows: 5, bays: 3, maxTier: 4, apgShare: 0.12, frontRow: "first" },
  // CONE terminal: two rows of three blocks, lanes between them; the warehouse sits behind (Terminal.tsx).
  ...[30, -6].flatMap((dz) =>
    [-40, -10, 20].map((dx) => ({
      area: "terminal" as const,
      x: tx + dx,
      z: tz + dz,
      base: 0,
      rows: 6,
      bays: 2,
      maxTier: 3,
      apgShare: 0.35,
      // The aerial camera comes in from +X.
      frontRow: "last" as const,
    })),
  ),
];

// mulberry32: tiny, seeded, deterministic.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildStacks(): StackedContainer[] {
  const random = rng(1996);
  const out: StackedContainer[] = [];
  const H = CONTAINER["40"].height;
  const half20 = CONTAINER["20"].length / 2 + 0.03;

  BLOCKS.forEach((b, block) => {
    for (let row = 0; row < b.rows; row++) {
      for (let bay = 0; bay < b.bays; bay++) {
        const x = b.x + row * ROW_PITCH;
        const z = b.z - bay * BAY_PITCH;
        // A slot holds one 40' or a pair of 20' all the way up, as in a real yard; the ship bay is all 40'.
        const twenties = b.area !== "ship" && random() < 0.3;
        const tiers = Math.max(b.minTier ?? 1, Math.ceil(random() * b.maxTier));
        const front = row === (b.frontRow === "first" ? 0 : b.rows - 1) && bay === 0;
        const spots: [ContainerType, number][] = twenties ? [["20", z - half20], ["20", z + half20]] : [["40", z]];
        spots.forEach(([type, sz]) => {
          let below: string | null = null;
          for (let tier = 0; tier < tiers; tier++) {
            if (b.skip?.(row, bay, tier)) continue;
            // No two equal colors stacked; the box under a forced APG top can't be APG either.
            const avoid: Set<string | null> = new Set([below, front && tier === tiers - 2 ? APG_NAVY : null]);
            const apg: boolean = (front && tier === tiers - 1) || (random() < b.apgShare && !avoid.has(APG_NAVY));
            let i = Math.floor(random() * CARRIER_COLORS.length);
            while (avoid.has(CARRIER_COLORS[i])) i = (i + 1) % CARRIER_COLORS.length;
            const color: string = apg ? APG_NAVY : CARRIER_COLORS[i];
            const y = b.base + tier * H;
            out.push({ type, area: b.area, block, position: [x, y, sz], rotated: false, tier, color, apg, front });
            below = color;
          }
        });
      }
    }
  });
  return out;
}

export const STACKS = buildStacks();

// Footprint of each terminal block (center and half sizes, with a 0.3 m margin): Terminal paints and lights around it.
export const TERMINAL_BLOCKS = BLOCKS.filter((b) => b.area === "terminal").map((b) => {
  const x0 = b.x - CONTAINER["40"].width / 2 - 0.3;
  const x1 = b.x + (b.rows - 1) * ROW_PITCH + CONTAINER["40"].width / 2 + 0.3;
  const z1 = b.z + CONTAINER["40"].length / 2 + 0.3;
  const z0 = b.z - (b.bays - 1) * BAY_PITCH - CONTAINER["40"].length / 2 - 0.3;
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2 };
});
