import { BufferGeometry, Float32BufferAttribute, MathUtils, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SHIP_DECK_Y } from "../anchors";
import { beam, block } from "./craneGeometry";

// Cabotage feeder, in its own frame: origin at the hull's center on the waterline (y = 0), bow toward -Z.
export const SHIP = {
  length: 140,
  beam: 22,
  draft: 8,
  // Main deck amidships; it rises to a forecastle at the bow.
  deckY: 5,
  // Hatch covers' top, where the deck containers rest (same as the world anchor: the ship floats at y = 0).
  hatchTop: SHIP_DECK_Y,
  // Bay centers (40' slots), aft-most first: just forward of the superstructure.
  bayZ: Array.from({ length: 7 }, (_, k) => 40 - k * (12.192 + 0.6)),
  // Superstructure (accommodation, five decks) aft.
  house: { z0: 47.5, z1: 59, halfWidth: 8.5, deckHeight: 2.8, decks: 5 },
};

const STATIONS = 56;
const HALF = SHIP.length / 2;

// s: 0 at the stern's transom, 1 at the stem.
const zAt = (s: number) => HALF - SHIP.length * s;

// Half-breadths. Deck lines run fuller than the waterline at the bow: that's the flare.
function halfAt(s: number, power: number) {
  if (s < 0.12) return MathUtils.lerp(power > 1 ? 9 : 10.4, 11, s / 0.12);
  if (s <= 0.66) return 11;
  return 11 * Math.pow(Math.cos(((s - 0.66) / 0.34) * (Math.PI / 2)), power);
}
const deckAt = (s: number) => SHIP.deckY + 2.6 * Math.max(0, (s - 0.8) / 0.2) ** 2 + 0.6 * Math.max(0, (0.1 - s) / 0.1);
// The keel sweeps up into the stern's run; underwater, the bulb swells the forefoot.
const keelAt = (s: number) => -SHIP.draft + 5.2 * Math.max(0, 1 - s / 0.1) ** 2;
const bulbAt = (s: number) => 1.8 * MathUtils.smoothstep(s, 0.86, 0.95) * (1 - MathUtils.smoothstep(s, 0.975, 1));

// One half-section, keel center to deck edge (x ≥ 0).
function halfSection(s: number): [number, number][] {
  const wl = halfAt(s, 1.15);
  const deck = halfAt(s, 0.55);
  const keel = keelAt(s);
  const top = deckAt(s);
  const bulb = bulbAt(s);
  const r = Math.min(2.6, wl * 0.8, (0 - keel) * 0.7);
  const pts: [number, number][] = [[0, keel]];
  for (let k = 0; k <= 4; k++) {
    const a = -Math.PI / 2 + (k / 4) * (Math.PI / 2);
    const y = keel + r + r * Math.sin(a);
    pts.push([Math.max(0, wl - r + r * Math.cos(a)) + (y < -2.5 ? bulb : 0), y]);
  }
  pts.push([wl + bulb * 0.3, -2.5], [wl, 0], [MathUtils.lerp(wl, deck, 0.6), top * 0.6], [deck, top]);
  return pts;
}

function buildHull() {
  const positions: number[] = [];
  const index: number[] = [];
  let ring = 0;
  for (let i = 0; i <= STATIONS; i++) {
    const s = i / STATIONS;
    const half = halfSection(s);
    // Port deck edge → keel → starboard deck edge.
    const full = [...half.slice(1).reverse().map(([x, y]) => [-x, y]), ...half];
    ring = full.length;
    for (const [x, y] of full) positions.push(x, y, zAt(s));
  }
  for (let i = 0; i < STATIONS; i++) {
    for (let j = 0; j < ring - 1; j++) {
      const a = i * ring + j;
      const b = a + ring;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  // Transom: a fan closing the stern.
  const center = positions.length / 3;
  positions.push(0, (keelAt(0) + deckAt(0)) / 2, zAt(0));
  for (let j = 0; j < ring - 1; j++) index.push(center, j + 1, j);

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

// The main deck: a strip between the deck edges, station to station.
function buildDeck() {
  const positions: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= STATIONS; i++) {
    const s = i / STATIONS;
    const d = halfAt(s, 0.55);
    const y = deckAt(s);
    positions.push(-d, y, zAt(s), d, y, zAt(s));
    if (i > 0) {
      const a = (i - 1) * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export function buildShipGeometry() {
  const { hatchTop, deckY, bayZ, house } = SHIP;
  // Hatch covers over each bay, wide enough for 7 rows; their top is where the boxes sit.
  const hatches = mergeGeometries(bayZ.map((z) => block(v(-10, deckY, z - 6.35), v(10, hatchTop, z + 6.35))))!;

  const top = deckY + house.decks * house.deckHeight;
  const superstructure = mergeGeometries([
    // Accommodation, stepped in a little per deck.
    ...Array.from({ length: house.decks }, (_, d) =>
      block(
        v(-house.halfWidth + d * 0.15, deckY + d * house.deckHeight, house.z0 + d * 0.2),
        v(house.halfWidth - d * 0.15, deckY + (d + 1) * house.deckHeight, house.z1),
      ),
    ),
    // Navigation bridge with its wings out past the hull.
    block(v(-11.6, top, house.z0 + 0.6), v(11.6, top + 2.8, house.z0 + 5.4)),
    block(v(-6, top + 2.8, house.z0 + 0.6), v(6, top + 3.1, house.z0 + 5.4)),
  ])!;
  const funnel = block(v(-2.3, deckY, 60), v(2.3, top + 4.5, 64.5));
  const mast = mergeGeometries([
    beam(v(0, top + 3.1, house.z0 + 3), v(0, top + 10, house.z0 + 3), 0.3),
    beam(v(-3, top + 8.5, house.z0 + 3), v(3, top + 8.5, house.z0 + 3), 0.18),
    // Foremast at the forecastle.
    beam(v(0, deckAt(0.93), zAt(0.93)), v(0, deckAt(0.93) + 7, zAt(0.93)), 0.35),
  ])!;
  // Window bands per deck: the forward face and both sides.
  const windows = mergeGeometries(
    Array.from({ length: house.decks }, (_, d) => {
      const y0 = deckY + d * house.deckHeight + 1.1;
      const y1 = y0 + 0.7;
      const hw = house.halfWidth - d * 0.15;
      const z0 = house.z0 + d * 0.2;
      return [
        block(v(-hw + 0.8, y0, z0 - 0.05), v(hw - 0.8, y1, z0)),
        block(v(-hw - 0.05, y0, z0 + 0.8), v(-hw, y1, house.z1 - 0.8)),
        block(v(hw, y0, z0 + 0.8), v(hw + 0.05, y1, house.z1 - 0.8)),
      ];
    })
      .flat()
      .concat(block(v(-11.4, top + 1.1, house.z0 + 0.55), v(11.4, top + 2.2, house.z0 + 0.6))),
  )!;

  return { hull: buildHull(), deck: buildDeck(), hatches, superstructure, funnel, mast, windows };
}
