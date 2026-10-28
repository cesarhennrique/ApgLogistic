"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Mesh, MeshStandardMaterial } from "three";
import { journeyProgress } from "./progress";
import { OCEAN_FADE } from "./scene/Ocean";
import { withSkyFog } from "./scene/skyShared";

const groundMaterial = withSkyFog(new MeshStandardMaterial({ color: "#0a1338" }));

// The ground under everything once the sea has faded (every chapter is modeled now; no boxes left).
export function Placeholders() {
  const ground = useRef<Mesh>(null);
  // Land takes over as the sea fades; just below the (flattened) sea so they never z-fight.
  useFrame(() => (ground.current!.visible = journeyProgress.value >= OCEAN_FADE[0]));

  return (
    <mesh ref={ground} rotation-x={-Math.PI / 2} position={[0, -0.02, -40]} material={groundMaterial} receiveShadow>
      {/* Past the camera's far plane (400) in every direction, so the fog, not an edge, meets the sky. */}
      <planeGeometry args={[1200, 1200]} />
    </mesh>
  );
}
