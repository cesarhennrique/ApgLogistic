import { Color, Vector3 } from "three";

// One set of uniforms shared by the sky and the sea, written once per frame by Lighting.
export const skyUniforms = {
  uSkyTop: { value: new Color() },
  uSkyHorizon: { value: new Color() },
  uSunDir: { value: new Vector3(0, 0.05, -1) },
  uSunColor: { value: new Color() },
  uSunIntensity: { value: 0 },
  uFogDensity: { value: 0 },
};

// The sky's color in a direction. The sea uses it for reflections and fog, so they match the dome.
export const SKY_GLSL = /* glsl */ `
uniform vec3 uSkyTop;
uniform vec3 uSkyHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uSunIntensity;
uniform float uFogDensity;

vec3 skyGradient(vec3 dir) {
  float h = clamp(dir.y, 0.0, 1.0);
  // A thin warm band on the horizon that gives way to navy by ~20° up.
  vec3 col = mix(uSkyHorizon, uSkyTop, 1.0 - exp(-h * 10.0));
  // Warm haze around the sun, hugging the horizon.
  float s = max(dot(dir, uSunDir), 0.0);
  col += uSunColor * uSunIntensity * 0.12 * pow(s, 14.0) * (1.0 - smoothstep(0.0, 0.18, h));
  return col;
}

// Breaks up 8-bit banding in the long, smooth gradients.
float dither(vec2 frag) {
  return (fract(sin(dot(frag, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
}
`;
