// The reflection cube is re-baked only when the scroll rests (a bake stalls a phone's frame) and the sky
// has changed enough to show in reflections.
export const REBAKE_REST = 0.2;
export const REBAKE_DELTA = 0.05;

export function shouldRebake({
  progress,
  bakedAt,
  stillFor,
}: {
  progress: number;
  bakedAt: number | null;
  // Seconds since the progress last changed.
  stillFor: number;
}): boolean {
  if (bakedAt === null) return true;
  // The epsilon keeps exactly 0.05 a rebake despite floating point.
  return stillFor >= REBAKE_REST && Math.abs(progress - bakedAt) >= REBAKE_DELTA - 1e-9;
}
