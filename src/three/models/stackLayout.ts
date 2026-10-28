import { Color } from "three";
import { CRANE_POSITION, QUAY_TOP, SHIP_DECK_Y, SHIP_PICK_POINT } from "../anchors";
import { SCENE_POSITIONS } from "../camera-path";
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
};

// Real carrier colors, desaturated and a touch darker so the yard reads as one muted field (no logos).
const CARRIERS = [
  "#42b0d5", // light blue
  "#d1a83c", // ochre
  "#1f4a8c", // dark blue
  "#e8601c", // orange
  "#2e7d4f", // green
  "#2f5fa8", // blue
  "#b4006e", // magenta
  "#b5272d", // red
  "#a8a39a", // leasing grey
  "#8b4a2f", // leasing brown
].map((hex) => {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return `#${c.setHSL(hsl.h, hsl.s * 0.55, hsl.l * 0.92).getHexString()}`;
});

// Brand navy, a hair lighter than navy-900 so it still reads at dusk. The red stripe is its own mesh.
export const APG_NAVY = "#121c4a";

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
  // Slots left empty (by row-bay key): the crane's working slot on the ship.
  skip?: (row: number, bay: number, tier: number) => boolean;
};

const ROW_PITCH = CONTAINER["40"].width + 0.3;
const BAY_PITCH = CONTAINER["40"].length + 0.6;

const [tx, , tz] = SCENE_POSITIONS.terminal;

const BLOCKS: Block[] = [
  // Ship's deck bay under the crane (the hull comes in Prompt 11). Its middle top slot is the box the crane moves.
  {
    area: "ship",
    x: SHIP_PICK_POINT.x - ROW_PITCH,
    z: SHIP_PICK_POINT.z + BAY_PITCH,
    base: SHIP_DECK_Y,
    rows: 3,
    bays: 3,
    maxTier: 2,
    apgShare: 0.25,
    skip: (row, bay, tier) => row === 1 && bay === 1 && tier === 1,
  },
  // Port stacks on the quay, inland of the crane and past it, so the crane shots look at it clear.
  { area: "port", x: CRANE_POSITION.x + 12, z: CRANE_POSITION.z - 18, base: QUAY_TOP, rows: 5, bays: 3, maxTier: 4, apgShare: 0.12 },
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
        // Taller toward the middle of a block, never empty on the ship.
        const tiers = Math.max(b.area === "ship" ? b.maxTier : 1, Math.ceil(random() * b.maxTier));
        for (let tier = 0; tier < tiers; tier++) {
          if (b.skip?.(row, bay, tier)) continue;
          const y = b.base + tier * H;
          const spots: [ContainerType, number][] = twenties ? [["20", z - half20], ["20", z + half20]] : [["40", z]];
          for (const [type, sz] of spots) {
            const apg = random() < b.apgShare;
            const color = apg ? APG_NAVY : CARRIERS[Math.floor(random() * CARRIERS.length)];
            out.push({ type, area: b.area, block, position: [x, y, sz], rotated: false, tier, color, apg });
          }
        }
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
