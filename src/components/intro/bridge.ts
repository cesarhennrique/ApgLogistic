// Shared by the DOM intro and the 3D canvas, which loads as its own chunk later: plain values, no three.
export const introBridge = {
  // The hero map's entrance, 0–1. The timeline calls run (HeroMapStage's intro) and keeps t, so a map that
  // mounts late picks up where the timeline is. 1 when no intro plays (reduced motion, ?p, ?debug).
  map: { t: 1, run: null as ((t: number) => void) | null },
  // Loader signals written from inside the canvas.
  assets: 0,
  frame: false,
  // The loader covers the page: the canvas renders on demand only (its first frame), not behind it every frame.
  covered: false,
};

const coverListeners = new Set<() => void>();
export function setCovered(covered: boolean) {
  introBridge.covered = covered;
  for (const listener of coverListeners) listener();
}
export function subscribeCovered(listener: () => void) {
  coverListeners.add(listener);
  return () => void coverListeners.delete(listener);
}

export function setMapIntro(t: number) {
  introBridge.map.t = t;
  introBridge.map.run?.(t);
}

// sessionStorage key: the loader has played in this session. Read by layout.tsx's inline script too.
export const SEEN_KEY = "apg-intro";

// The map's entrance length (ms of the timeline at t = 0–1): outlines and dot wave 0–900, routes 300–1500.
export const MAP_INTRO_MS = 1500;
