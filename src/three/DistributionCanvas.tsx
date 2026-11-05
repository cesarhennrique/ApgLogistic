"use client";

import { Canvas } from "@react-three/fiber";
import { useQualityTier } from "@/lib/quality";
import { DistributionStage } from "./stages/DistributionStage";

// Client-only (next/dynamic ssr:false), mounted by scene 5 once it comes near. Renders on demand (the scene asks
// for a frame at each step of its progress), never while off screen.
// The 'low' tier (lib/quality): dpr ≤ 1.5 and the destinations' pulses off. onReady: once the stage (and what it
// loads) is mounted, so the scene can drop the still map it shows until then.
export default function DistributionCanvas({ onScreen, onReady }: { onScreen: boolean; onReady: () => void }) {
  const tier = useQualityTier();
  return (
    <Canvas
      dpr={[1, tier === "low" ? 1.5 : 2]}
      frameloop={onScreen ? "demand" : "never"}
      flat
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 35, near: 0.5, far: 5000, position: [0, 50, 0] }}
    >
      <DistributionStage pulse={tier !== "low"} onReady={onReady} />
    </Canvas>
  );
}
