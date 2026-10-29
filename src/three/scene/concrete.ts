import { MeshStandardMaterial } from "three";


type Rect = { x: number; z: number; hx: number; hz: number };
type Segment = { from: [number, number]; to: [number, number] };

export type ConcreteMarkings = {
  // White outlines (stack blocks, bays).
  outlines?: Rect[];
  // Yellow dashed lines (lanes).
  dashes?: Segment[];
  // Solid yellow lines (quay edge, safety lines).
  solids?: Segment[];
};

const f = (n: number) => n.toFixed(3);

// Concrete with procedural wear, slab joints and paint, all in the shader (0 bytes of texture).
export function createConcreteMaterial(m: ConcreteMarkings = {}) {
  const material = new MeshStandardMaterial({ color: "#a39f97", roughness: 0.94, metalness: 0 });
  const paint = [
    ...(m.outlines ?? []).map(
      (r) => `paint = max(paint, vec4(0.92, 0.92, 0.9, outline(p, vec2(${f(r.x)}, ${f(r.z)}), vec2(${f(r.hx)}, ${f(r.hz)}))));`,
    ),
    ...(m.dashes ?? []).map(
      (s) => `paint = mix(paint, vec4(0.95, 0.72, 0.16, 1.0), line(p, vec2(${f(s.from[0])}, ${f(s.from[1])}), vec2(${f(s.to[0])}, ${f(s.to[1])}), true));`,
    ),
    ...(m.solids ?? []).map(
      (s) => `paint = mix(paint, vec4(0.95, 0.72, 0.16, 1.0), line(p, vec2(${f(s.from[0])}, ${f(s.from[1])}), vec2(${f(s.to[0])}, ${f(s.to[1])}), false));`,
    ),
  ].join("\n");

  // Each call bakes different markings into the GLSL; the closure's source is identical, so key on the code.
  const key = `concrete|${paint}`;
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vConcrete;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvConcrete = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying vec2 vConcrete;
        float cHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float cNoise(vec2 p) {
          vec2 i = floor(p); vec2 u = fract(p); u = u * u * (3.0 - 2.0 * u);
          return mix(mix(cHash(i), cHash(i + vec2(1, 0)), u.x), mix(cHash(i + vec2(0, 1)), cHash(i + vec2(1, 1)), u.x), u.y);
        }
        // 1 on a 0.15 m band just inside the rectangle's edge.
        float outline(vec2 p, vec2 c, vec2 h) {
          vec2 d = abs(p - c) - h;
          float e = max(d.x, d.y);
          return step(-0.15, e) * step(e, 0.0);
        }
        // 1 within 0.08 m of the segment; dashed: 3 m on, 3 m off.
        float line(vec2 p, vec2 a, vec2 b, bool dashed) {
          vec2 ab = b - a;
          float t = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
          float on = step(length(p - a - ab * t), 0.08);
          return dashed ? on * step(fract(t * length(ab) / 6.0), 0.5) : on;
        }`,
      )
      .replace(
        "#include <color_fragment>",
        /* glsl */ `#include <color_fragment>
        vec2 p = vConcrete;
        // Wear: two octaves of value noise, and large soft stains.
        float wear = 0.55 * cNoise(p * 0.9) + 0.3 * cNoise(p * 3.7) + 0.15 * cNoise(p * 0.08);
        diffuseColor.rgb *= 0.82 + 0.26 * wear;
        // Slab joints every 6 m.
        vec2 g = abs(fract(p / 6.0 + 0.5) - 0.5) * 6.0;
        diffuseColor.rgb *= mix(0.72, 1.0, smoothstep(0.0, 0.05, min(g.x, g.y)));
        vec4 paint = vec4(0.0);
        ${paint}
        // Paint scuffed by the same wear.
        diffuseColor.rgb = mix(diffuseColor.rgb, paint.rgb, paint.a * (0.65 + 0.35 * wear));`,
      );
  };
  return material;
}
