import type { ChapterText } from "@/content/site";
import { MathUtils } from "three";

export type ChapterId = ChapterText["id"];

// The hero plays on time, before the track, so its range is empty.
export const CHAPTERS = [
  { id: "hero", start: 0, end: 0 },
  { id: "crane", start: 0, end: 0.2 },
  { id: "load", start: 0.2, end: 0.4 },
  { id: "highway", start: 0.4, end: 0.6 },
  { id: "terminal", start: 0.6, end: 0.8 },
  { id: "distribution", start: 0.8, end: 1 },
] as const satisfies readonly { id: ChapterId; start: number; end: number }[];

export function localProgress(global: number, id: ChapterId): number {
  const chapter = CHAPTERS.find((c) => c.id === id)!;
  if (chapter.id === "hero") return global > 0 ? 1 : 0;
  return MathUtils.clamp((global - chapter.start) / (chapter.end - chapter.start), 0, 1);
}

// The chapter whose text the track shows; the hero's text is the Hero itself.
export function trackChapterAt(global: number): ChapterId {
  const track = CHAPTERS.slice(1);
  return (track.find((c) => global < c.end) ?? track[track.length - 1]).id;
}
