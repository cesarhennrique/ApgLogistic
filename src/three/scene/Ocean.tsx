"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { MathUtils, type Mesh, PlaneGeometry, RepeatWrapping, ShaderMaterial } from "three";
import { journeyProgress } from "../progress";
import { SKY_GLSL, skyUniforms } from "./skyShared";

// The sea fades out while the camera leaves the port.
export const OCEAN_FADE = [0.38, 0.42] as const;

const SIZE = 400;
// ~2.5 units per quad: every wave below is at least 5 quads long.
const SEGMENTS = 160;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vWorld;
  varying vec3 vNormal;

  // direction (xy), steepness, wavelength
  const vec4 WAVES[3] = vec4[3](
    vec4(1.0, 0.35, 0.07, 22.0),
    vec4(0.45, 1.0, 0.06, 14.0),
    vec4(-0.7, 0.6, 0.05, 31.0)
  );

  vec3 gerstner(vec4 w, vec3 p, inout vec3 tangent, inout vec3 binormal) {
    float k = 6.2831853 / w.w;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(w.xy);
    float f = k * (dot(d, p.xz) - c * uTime);
    float a = w.z / k;
    float s = w.z * sin(f);
    float co = w.z * cos(f);
    tangent += vec3(-d.x * d.x * s, d.x * co, -d.x * d.y * s);
    binormal += vec3(-d.x * d.y * s, d.y * co, -d.y * d.y * s);
    return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
  }

  void main() {
    vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    vec3 offset = vec3(0.0);
    for (int i = 0; i < 3; i++) offset += gerstner(WAVES[i], p, tangent, binormal);
    // Flatten as it fades, so the ground that replaces it never pokes through a trough.
    p += offset * uOpacity;
    vWorld = p;
    vNormal = normalize(mix(vec3(0.0, 1.0, 0.0), normalize(cross(binormal, tangent)), uOpacity));
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  ${SKY_GLSL}
  uniform sampler2D uNormalMap;
  uniform float uTime;
  uniform float uOpacity;
  varying vec3 vWorld;
  varying vec3 vNormal;

  vec2 detail(vec2 uv) {
    return texture2D(uNormalMap, uv).xy * 2.0 - 1.0;
  }

  void main() {
    float dist = distance(cameraPosition, vWorld);
    // Two scales of ripples, rolling in different directions.
    vec2 ripple = detail(vWorld.xz * 0.045 + vec2(0.012, 0.008) * uTime)
      + 0.6 * detail(vWorld.xz * 0.13 + vec2(-0.02, 0.015) * uTime);
    // Calmer far field: fewer sub-pixel sparkles that would shimmer.
    ripple *= mix(0.35, 0.12, smoothstep(30.0, 180.0, dist));
    vec3 n = normalize(vNormal + vec3(ripple.x, 0.0, ripple.y));

    vec3 v = normalize(cameraPosition - vWorld);
    float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    vec3 r = reflect(-v, n);
    r.y = abs(r.y);
    vec3 reflection = skyGradient(r);
    // Body color picks up the sky above it, so the sea darkens with the night.
    vec3 deep = uSkyTop * 0.18 + uSkyHorizon * 0.02;

    // Sun glitter: a tight core plus a wide lobe that stretches into the golden path toward the camera.
    float sr = max(dot(r, uSunDir), 0.0);
    float sunUp = smoothstep(-0.03, 0.02, uSunDir.y);
    vec3 glitter = uSunColor * uSunIntensity * (pow(sr, 1500.0) * 10.0 + pow(sr, 160.0) * 0.8) * sunUp;

    vec3 col = mix(deep, reflection, fresnel) + glitter;

    // Exp2 fog toward the sky's own horizon in this direction: no seam where sea meets sky.
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * dist * dist);
    col = mix(col, skyGradient(normalize(vec3(-v.x, 0.0, -v.z))), fog);

    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor.rgb += dither(gl_FragCoord.xy);
  }
`;

const geometry = new PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS).rotateX(-Math.PI / 2);
const material = new ShaderMaterial({
  uniforms: { ...skyUniforms, uNormalMap: { value: null }, uTime: { value: 0 }, uOpacity: { value: 1 } },
  vertexShader,
  fragmentShader,
  transparent: true,
});

export function Ocean({ reducedMotion }: { reducedMotion: boolean }) {
  const mesh = useRef<Mesh>(null);
  const normalMap = useTexture("/3d/textures/water-normal.webp", (t) => {
    t.wrapS = t.wrapT = RepeatWrapping;
  });
  useLayoutEffect(() => {
    material.uniforms.uNormalMap.value = normalMap;
  }, [normalMap]);

  useFrame(({ clock }) => {
    const opacity = 1 - MathUtils.smoothstep(journeyProgress.value, ...OCEAN_FADE);
    material.uniforms.uOpacity.value = opacity;
    // Reduced motion: a still sea.
    if (!reducedMotion) material.uniforms.uTime.value = clock.elapsedTime;
    mesh.current!.visible = opacity > 0;
  });

  // Centered ahead of the port so the far edge sits deep in the fog.
  return <mesh ref={mesh} geometry={geometry} material={material} position={[0, 0, -60]} />;
}
