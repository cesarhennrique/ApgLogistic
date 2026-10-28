"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  type Group,
  type Points,
  PointsMaterial,
  ShaderMaterial,
} from "three";
import { journeyProgress } from "../progress";
import { sampleLight } from "../lightKeys";
import { SKY_GLSL, skyUniforms } from "./skyShared";

const RADIUS = 300;
const STAR_COUNT = 1400;

const skyMaterial = new ShaderMaterial({
  uniforms: skyUniforms,
  side: BackSide,
  depthWrite: false,
  fog: false,
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    ${SKY_GLSL}
    varying vec3 vDir;
    void main() {
      vec3 dir = normalize(vDir);
      vec3 col = skyGradient(dir);
      float s = max(dot(dir, uSunDir), 0.0);
      // Disc a bit larger than the real sun (~1.2°), soft edge, two-lobe halo; clipped by the horizon.
      float disc = smoothstep(0.99975, 0.99985, s);
      float halo = pow(s, 800.0) * 0.6 + pow(s, 90.0) * 0.12;
      float above = smoothstep(-0.003, 0.003, dir.y);
      col += uSunColor * uSunIntensity * (disc * 2.2 + halo) * above;
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      gl_FragColor.rgb += dither(gl_FragCoord.xy);
    }
  `,
});

// Deterministic, so screenshots of the night sky stay stable.
function buildStarGeometry() {
  let seed = 1996;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const positions = new Float32Array(STAR_COUNT * 3);
  const colors = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    // Upper hemisphere only, thinning toward the horizon haze.
    const y = 0.08 + 0.92 * Math.sqrt(rand());
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - y * y);
    positions.set([Math.cos(a) * r * (RADIUS - 10), y * (RADIUS - 10), Math.sin(a) * r * (RADIUS - 10)], i * 3);
    const b = 0.25 + 0.75 * rand() ** 3;
    colors.set([b * 0.85, b * 0.9, b], i * 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(positions, 3));
  g.setAttribute("color", new BufferAttribute(colors, 3));
  return g;
}

const starGeometry = buildStarGeometry();
const starMaterial = new PointsMaterial({
  size: 1.6,
  sizeAttenuation: false,
  vertexColors: true,
  transparent: true,
  opacity: 0,
  blending: AdditiveBlending,
  depthWrite: false,
  fog: false,
});
const light = sampleLight(0);

export function Sky() {
  const group = useRef<Group>(null);
  const stars = useRef<Points>(null);

  useFrame(({ camera }) => {
    // The dome rides with the camera, so the horizon stays at infinity.
    group.current!.position.copy(camera.position);
    const { stars: amount } = sampleLight(journeyProgress.value, light);
    starMaterial.opacity = amount * 0.9;
    stars.current!.visible = amount > 0;
  });

  return (
    <group ref={group}>
      <mesh material={skyMaterial} renderOrder={-1} frustumCulled={false}>
        <sphereGeometry args={[RADIUS, 48, 24]} />
      </mesh>
      <points
        ref={stars}
        geometry={starGeometry}
        material={starMaterial}
        renderOrder={-1}
        frustumCulled={false}
      />
    </group>
  );
}
