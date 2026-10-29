"use client";

import { MeshStandardMaterial } from "three";
import { SHIP_POSITION } from "../anchors";
import { buildShipGeometry } from "../models/shipGeometry";
import { ContainerStacks } from "./ContainerStacks";
import { GlbOr } from "./GlbModel";

const ship = buildShipGeometry();

// Topsides #1b1e2b, a thin white boot-top at the waterline, antifouling #7a1f1f below it; by height in the
// ship's own frame.
const hullMaterial = new MeshStandardMaterial({ roughness: 0.6, metalness: 0.25 });
hullMaterial.customProgramCacheKey = () => "ship-hull";
hullMaterial.onBeforeCompile = (shader) => {
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
const deckMaterial = new MeshStandardMaterial({ color: "#4a3b36", roughness: 0.85 });
const hatchMaterial = new MeshStandardMaterial({ color: "#3c4a45", roughness: 0.7, metalness: 0.2 });
const houseMaterial = new MeshStandardMaterial({ color: "#e6e3dc", roughness: 0.65 });
const funnelMaterial = new MeshStandardMaterial({ color: "#2b3140", roughness: 0.6 });
const sootMaterial = new MeshStandardMaterial({ color: "#15161a", roughness: 0.8 });
const mastMaterial = new MeshStandardMaterial({ color: "#2a2d33", roughness: 0.5, metalness: 0.4 });
// Dark glass.
const windowMaterial = new MeshStandardMaterial({ color: "#101522", roughness: 0.2, metalness: 0.6 });

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

// The feeder, docked under the crane's boom.
export function Ship() {
  return (
    <group position={SHIP_POSITION}>
      {/* The model's bow is at -Z; turned around it heads +Z, with its superstructure at the far end. */}
      <group rotation-y={Math.PI}>
        <GlbOr url={process.env.NEXT_PUBLIC_SHIP_GLB}>
          <ProceduralShip />
        </GlbOr>
      </group>
      {/* The stacks are laid out in the port's frame: undo the berth offset. */}
      <group position={[-SHIP_POSITION.x, -SHIP_POSITION.y, -SHIP_POSITION.z]}>
        <ContainerStacks areas={["ship"]} />
      </group>
    </group>
  );
}
