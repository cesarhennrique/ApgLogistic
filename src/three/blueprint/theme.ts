import { Color, MathUtils } from "three";
import { NAVY, SAND, stageBackground } from "../stages/background";

// The technical drawing's two inks (spec §3, "Estilo: planta técnica"): by the stage's background.
export const THEMES = {
  // fillTop: the up-facing faces, a touch lighter, so volume reads without light.
  dark: { stroke: new Color("#f3efe7"), strokeOpacity: 0.75, secondaryOpacity: 0.35, fill: new Color("#121c47"), fillTop: new Color("#1a2656") },
  light: { stroke: new Color("#0a1338"), strokeOpacity: 0.85, secondaryOpacity: 0.35, fill: new Color("#fbf9f5"), fillTop: new Color("#ffffff") },
};

export type BlueprintTheme = { stroke: Color; strokeOpacity: number; secondaryOpacity: number; fill: Color; fillTop: Color };

const background = new Color();

// How light the stage is at t: 0 on navy, 1 on sand, read off the background itself so the inks follow its
// transitions exactly.
export function lightness(t: number): number {
  stageBackground(t, background);
  return MathUtils.clamp((background.r - NAVY.r) / (SAND.r - NAVY.r), 0, 1);
}

export function blueprintTheme(
  t: number,
  out: BlueprintTheme = { stroke: new Color(), strokeOpacity: 0, secondaryOpacity: 0, fill: new Color(), fillTop: new Color() },
): BlueprintTheme {
  const k = lightness(t);
  const { dark, light } = THEMES;
  out.stroke.lerpColors(dark.stroke, light.stroke, k);
  out.fill.lerpColors(dark.fill, light.fill, k);
  out.fillTop.lerpColors(dark.fillTop, light.fillTop, k);
  out.strokeOpacity = MathUtils.lerp(dark.strokeOpacity, light.strokeOpacity, k);
  out.secondaryOpacity = MathUtils.lerp(dark.secondaryOpacity, light.secondaryOpacity, k);
  return out;
}
