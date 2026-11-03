"use client";

import { Canvas } from "@react-three/fiber";
import { DistributionStage } from "./stages/DistributionStage";

// Client-only (next/dynamic ssr:false), mounted by scene 5 once it comes near. Renders on demand (the scene asks
// for a frame at each step of its progress), never while off screen.
export default function DistributionCanvas({ onScreen }: { onScreen: boolean }) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={onScreen ? "demand" : "never"}
      flat
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 35, near: 0.5, far: 5000, position: [0, 50, 0] }}
    >
      <DistributionStage />
    </Canvas>
  );
}
