"use client";

import { Bloom, EffectComposer, Noise, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

// The drawing needs little: SMAA for the line work, a light bloom on what is brighter than 1 (only the red
// glow is), and a fine grain. No tone mapping: the inks are exact brand colors.
export function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.1} intensity={0.6} />
      <SMAA />
      <Noise opacity={0.025} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}
