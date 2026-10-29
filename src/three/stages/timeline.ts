import { CHAPTERS, type ChapterId } from "../chapters";

// The journey as a sequence of isolated stages, one per chapter, each on its own origin (≥ 1 km apart, so the
// two visible in a transition never overlap). The hero floats above the rest: the dive toward Suape goes down,
// through the map, into the crane's studio.
export const STAGE_IDS = CHAPTERS.map((c) => c.id);

export const STAGE_ORIGINS: Record<ChapterId, [number, number, number]> = {
  hero: [0, 0, 0],
  crane: [0, -1000, 0],
  load: [1000, -1000, 0],
  highway: [2000, -1000, 0],
  terminal: [3000, -1000, 0],
  distribution: [4000, -1000, 0],
};

// When each stage owns the camera; the gaps between spans are the transitions (camera and background move
// from one stage to the next). The hero's span is the start of the dive.
export const STAGE_SPANS: Record<ChapterId, [number, number]> = {
  hero: [0, 0.03],
  crane: [0.05, 0.19],
  load: [0.21, 0.4],
  highway: [0.42, 0.6],
  terminal: [0.62, 0.8],
  distribution: [0.82, 1],
};

// The stages to render at a progress: the one whose span holds it, or the pair it is moving between.
export function activeStages(t: number): ChapterId[] {
  const p = Math.min(Math.max(t, 0), 1);
  for (let i = 0; i < STAGE_IDS.length; i++) {
    const id = STAGE_IDS[i];
    const [a, b] = STAGE_SPANS[id];
    if (p >= a && p <= b) return [id];
    if (p < a) return [STAGE_IDS[i - 1], id];
  }
  return [STAGE_IDS[STAGE_IDS.length - 1]];
}
