// A scene's timeline is cut into stretches (enter → hold → leave). segment(p, start, end) is the local progress
// of the stretch [start, end] at scene progress p: 0 before it, 1 after it, eased in between.
export function segment(p: number, start: number, end: number, ease: (x: number) => number = (x) => x): number {
  const t = Math.min(Math.max((p - start) / (end - start), 0), 1);
  return ease(t);
}
