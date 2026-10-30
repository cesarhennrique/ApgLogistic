import { MathUtils } from "three";

// ?p=0.35 freezes the hero's dive; ?debug turns on OrbitControls and a progress slider.
export function readDebugParams(search: string): { frozen: number | null; debug: boolean } {
  const params = new URLSearchParams(search);
  const raw = params.get("p");
  const p = raw ? Number(raw) : NaN;
  return {
    frozen: Number.isFinite(p) ? MathUtils.clamp(p, 0, 1) : null,
    debug: params.has("debug"),
  };
}
