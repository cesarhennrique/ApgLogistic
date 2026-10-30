import { Color, MeshBasicMaterial, Vector2 } from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { type BlueprintTheme, blueprintTheme } from "./theme";

// The drawing's inks as shared uniform objects: every blueprint material points at these, so the theme changes
// for the whole scene with one write per frame (Backdrop).
export const ink = {
  stroke: { value: new Color() },
  primary: { value: 1 },
  secondary: { value: 0.35 },
  fill: { value: new Color() },
  // Faces turned up read a touch lighter: volume without light.
  fillTop: { value: new Color() },
  // Canvas size in CSS px: line widths are in px.
  resolution: { value: new Vector2(1, 1) },
};

const theme: BlueprintTheme = blueprintTheme(0);

export function applyTheme(t: number) {
  blueprintTheme(t, theme);
  ink.stroke.value.copy(theme.stroke);
  ink.primary.value = theme.strokeOpacity;
  ink.secondary.value = theme.secondaryOpacity;
  ink.fill.value.copy(theme.fill);
  ink.fillTop.value.copy(theme.fillTop);
}

export type Tone = { fill: { value: Color }; fillTop: { value: Color } };

// A fixed solid tone, for the only solid things in the drawing: sides and a slightly lighter top.
const solidTone = (side: string, top: string): Tone => ({ fill: { value: new Color(side) }, fillTop: { value: new Color(top) } });
// The APG box (navy #1A2350) and its red band.
export const APG_TONE = solidTone("#1a2350", "#232d61");
export const RED_TONE = solidTone("#e31e24", "#ea3a3f");

// Unlit fill, two tones by the face's world normal (up-facing lighter). Instancing-aware. Pushed back in depth
// (polygonOffset) so its own edges never z-fight with it. Always blended: its opacity fades in on reveal.
export function fillMaterial(tone: Tone = ink): MeshBasicMaterial {
  const material = new MeshBasicMaterial({ transparent: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  material.customProgramCacheKey = () => "blueprint-fill";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFill = tone.fill;
    shader.uniforms.uFillTop = tone.fillTop;
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying float vUp;").replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      vec3 upNormal = normal;
      #ifdef USE_INSTANCING
        upNormal = mat3(instanceMatrix) * upNormal;
      #endif
      vUp = normalize(mat3(modelMatrix) * upNormal).y;`,
    );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 uFill;\nuniform vec3 uFillTop;\nvarying float vUp;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(uFill, uFillTop, step(0.7, vUp));");
  };
  return material;
}

// Constant-width line work in px: 1.25 main, 0.75 secondary. Dashed, because the reveal is a dash sliding in.
export function lineMaterial(weight: "primary" | "secondary" = "primary", color: { value: Color } = ink.stroke): LineMaterial {
  const material = new LineMaterial({ linewidth: weight === "primary" ? 1.25 : 0.75, dashed: true, transparent: true });
  material.uniforms.diffuse = color;
  material.uniforms.opacity = weight === "primary" ? ink.primary : ink.secondary;
  material.uniforms.resolution = ink.resolution;
  return material;
}
