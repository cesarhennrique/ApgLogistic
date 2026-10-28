"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Mesh, MeshStandardMaterial } from "three";
import { SCENE_POSITIONS } from "./camera-path";
import { journeyProgress } from "./progress";
import { OCEAN_FADE } from "./scene/Ocean";
import { withSkyFog } from "./scene/skyShared";

// shortcut: colored boxes mark the scenes still to model (highway and distribution: Prompt 12).
const BOX_SCENES = [
  { id: "highway", color: "#8b94a8" },
  { id: "distribution", color: "#e31e24" },
] as const;

const groundMaterial = withSkyFog(new MeshStandardMaterial({ color: "#0a1338" }));
const boxMaterials = BOX_SCENES.map(({ color }) => withSkyFog(new MeshStandardMaterial({ color })));

const BOXES: [number, number, number, number, number, number][] = [
  // x, y, z offset, then width, height, depth
  [0, 1, 0, 3, 2, 3],
  [-3, 0.6, 1.5, 1.6, 1.2, 1.6],
  [2.6, 0.4, -2, 1.2, 0.8, 2.4],
];

export function Placeholders() {
  const ground = useRef<Mesh>(null);
  // Land takes over as the sea fades; just below the (flattened) sea so they never z-fight.
  useFrame(() => (ground.current!.visible = journeyProgress.value >= OCEAN_FADE[0]));

  return (
    <>
      <mesh ref={ground} rotation-x={-Math.PI / 2} position={[0, -0.02, -40]} material={groundMaterial} receiveShadow>
        {/* Past the camera's far plane (400) in every direction, so the fog, not an edge, meets the sky. */}
        <planeGeometry args={[1200, 1200]} />
      </mesh>
      {BOX_SCENES.map(({ id }, k) => (
        <group key={id} position={SCENE_POSITIONS[id]}>
          {BOXES.map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]} material={boxMaterials[k]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}
