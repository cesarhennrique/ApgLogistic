"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Group, MeshStandardMaterial, PlaneGeometry, ShaderMaterial } from "three";
import { SHIP_POSITION } from "../anchors";
import { sampleLight } from "../lightKeys";
import { SHIP, buildShipGeometry } from "../models/shipGeometry";
import { journeyProgress } from "../progress";
import { shipPose, shipPoseAt } from "../shipPose";
import { ContainerStacks } from "./ContainerStacks";
import { GlbOr } from "./GlbModel";
import { SKY_GLSL, lostInFog, skyUniforms, withSkyFog } from "./skyShared";

const ship = buildShipGeometry();

// Topsides #1b1e2b, a thin white boot-top at the waterline, antifouling #7a1f1f below it; by height in the
// ship's own frame, so it stays put while the ship rolls.
const hullBase = new MeshStandardMaterial({ roughness: 0.6, metalness: 0.25 });
hullBase.customProgramCacheKey = () => "ship-hull";
hullBase.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vHullY;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHullY = position.y;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vHullY;")
    .replace(
      "#include <color_fragment>",
      /* glsl */ `#include <color_fragment>
      vec3 topsides = vec3(0.0116, 0.0130, 0.0242);
      vec3 bootTop = vec3(0.86);
      vec3 antifouling = vec3(0.195, 0.0137, 0.0137);
      vec3 hull = mix(antifouling, bootTop, smoothstep(-0.05, 0.0, vHullY));
      diffuseColor.rgb = mix(hull, topsides, smoothstep(0.32, 0.37, vHullY));`,
    );
};
const hullMaterial = withSkyFog(hullBase);
const deckMaterial = withSkyFog(new MeshStandardMaterial({ color: "#4a3b36", roughness: 0.85 }));
const hatchMaterial = withSkyFog(new MeshStandardMaterial({ color: "#3c4a45", roughness: 0.7, metalness: 0.2 }));
const houseMaterial = withSkyFog(new MeshStandardMaterial({ color: "#e6e3dc", roughness: 0.65 }));
const funnelMaterial = withSkyFog(new MeshStandardMaterial({ color: "#2b3140", roughness: 0.6 }));
const sootMaterial = withSkyFog(new MeshStandardMaterial({ color: "#15161a", roughness: 0.8 }));
const mastMaterial = withSkyFog(new MeshStandardMaterial({ color: "#2a2d33", roughness: 0.5, metalness: 0.4 }));
// Dark glass by day, warm cabin light at night.
const windowMaterial = withSkyFog(
  new MeshStandardMaterial({ color: "#101522", emissive: "#ffd39a", emissiveIntensity: 0, roughness: 0.2, metalness: 0.6 }),
);

// Wake: churned foam astern and two diverging lines, in a strip from the transom; strength follows speed.
const WAKE = { length: 110, from: 16, to: 46 };
const wakeMaterial = new ShaderMaterial({
  uniforms: { ...skyUniforms, uSpeed: { value: 0 }, uTime: { value: 0 } },
  transparent: true,
  depthWrite: false,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vec3 p = position;
      // u along the wake (0 at the transom), v across; the strip widens astern.
      p.x *= mix(${WAKE.from.toFixed(1)}, ${WAKE.to.toFixed(1)}, uv.y);
      p.z = ${(SHIP.length / 2).toFixed(1)} + uv.y * ${WAKE.length.toFixed(1)};
      vec4 world = modelMatrix * vec4(p, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    ${SKY_GLSL}
    uniform float uSpeed;
    uniform float uTime;
    varying vec2 vUv;
    varying vec3 vWorld;
    float wHash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
    float wNoise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(wHash(i), wHash(i + vec2(1, 0)), f.x), mix(wHash(i + vec2(0, 1)), wHash(i + vec2(1, 1)), f.x), f.y);
    }
    void main() {
      float u = vUv.y;
      float v = vUv.x * 2.0 - 1.0;
      vec2 q = vec2(v * 6.0, u * 30.0 - uTime * 0.8);
      float n = wNoise(q) * 0.6 + wNoise(q * 2.7) * 0.4;
      float churn = exp(-v * v * 9.0) * pow(1.0 - u, 1.6) * smoothstep(0.35, 0.8, n);
      float lines = smoothstep(0.1, 0.0, abs(abs(v) - 0.85)) * (1.0 - u) * smoothstep(0.3, 0.7, n);
      float d = distance(cameraPosition, vWorld);
      float seen = exp(-uFogDensity * uFogDensity * d * d);
      float a = clamp(churn + lines * 0.7, 0.0, 1.0) * clamp(uSpeed / 2.5, 0.0, 1.0) * seen * 0.75;
      gl_FragColor = vec4(mix(uSkyHorizon, vec3(0.9, 0.92, 0.95), 0.7), a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
const wakeGeometry = new PlaneGeometry(1, 1, 1, 1).rotateX(-Math.PI / 2).translate(0, 0.3, 0);

// Everything the ship draws, stacks included, fits in this sphere (at the berth and 30 m short of it).
const BOUNDS_RADIUS = 110;
const light = sampleLight(0);

function ProceduralShip() {
  return (
    <>
      <mesh geometry={ship.hull} material={hullMaterial} castShadow receiveShadow />
      <mesh geometry={ship.deck} material={deckMaterial} receiveShadow />
      <mesh geometry={ship.hatches} material={hatchMaterial} castShadow receiveShadow />
      <mesh geometry={ship.superstructure} material={houseMaterial} castShadow receiveShadow />
      <mesh geometry={ship.funnel} material={funnelMaterial} castShadow />
      <mesh geometry={ship.funnelTop} material={sootMaterial} />
      <mesh geometry={ship.mast} material={mastMaterial} castShadow />
      <mesh geometry={ship.windows} material={windowMaterial} />
    </>
  );
}

// The feeder: glides into its berth on time in the hero, docked under the crane's boom from then on.
export function Ship({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);

  useFrame(({ camera, clock }) => {
    const p = journeyProgress.value;
    Object.assign(shipPose, shipPoseAt(clock.elapsedTime, p, reducedMotion));
    const g = group.current!;
    g.position.set(SHIP_POSITION.x, SHIP_POSITION.y, SHIP_POSITION.z - shipPose.slide);
    g.rotation.z = shipPose.roll;
    g.visible = !lostInFog(camera.position, g.position, BOUNDS_RADIUS);
    wakeMaterial.uniforms.uSpeed.value = shipPose.speed;
    wakeMaterial.uniforms.uTime.value = clock.elapsedTime;
    windowMaterial.emissiveIntensity = sampleLight(p, light).lamps * 2.5;
  });

  return (
    <group ref={group}>
      {/* The model's bow is at -Z; turned around, it heads +Z, in toward the hero camera. */}
      <group rotation-y={Math.PI}>
        <GlbOr url={process.env.NEXT_PUBLIC_SHIP_GLB}>
          <ProceduralShip />
        </GlbOr>
        <mesh geometry={wakeGeometry} material={wakeMaterial} frustumCulled={false} />
      </group>
      {/* The stacks are laid out in world space at the berth: undo the berth offset so they ride the ship. */}
      <group position={[-SHIP_POSITION.x, -SHIP_POSITION.y, -SHIP_POSITION.z]}>
        <ContainerStacks areas={["ship"]} />
      </group>
    </group>
  );
}
