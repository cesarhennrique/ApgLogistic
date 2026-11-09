// The phone's clips (MobileJourney) that hold a source: those within a screen of the viewport, the nearest `max`
// (iOS decodes only a few videos at once; the rest show their poster). rects: each clip's box on screen, as
// getBoundingClientRect gives it; vh: the viewport's height. The chosen clips' indices, nearest first.
export function pickLoaded(rects: { top: number; bottom: number }[], vh: number, max = 2) {
  return rects
    .map((r, i) => ({ i, distance: Math.max(0, r.top - vh, -r.bottom), near: r.bottom >= -vh && r.top <= 2 * vh }))
    .filter((c) => c.near)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, max)
    .map((c) => c.i);
}
