"use client";

import { Bloom, EffectComposer, N8AO, Noise, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { TONE_MAPPING } from "./toneMap";

// One composer: ambient occlusion, a light bloom (only what's brighter than 1: the lamps and the red glow), the
// tone mapping (the renderer's is off), SMAA, 2–3% grain and a subtle vignette.
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <N8AO halfRes aoRadius={2.5} intensity={2} distanceFalloff={1} />
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.1} intensity={0.6} />
      <ToneMapping mode={TONE_MAPPING === "aces" ? ToneMappingMode.ACES_FILMIC : ToneMappingMode.AGX} />
      <SMAA />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.35} darkness={0.3} />
    </EffectComposer>
  );
}
