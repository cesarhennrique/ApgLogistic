"use client";

import { OrbitControls } from "@react-three/drei";
import { sampleCamera } from "./camera-path";
import { journeyProgress } from "./progress";

// Loaded only with ?debug, so production pays nothing when it is off.
export function DebugOrbit() {
  return <OrbitControls makeDefault target={sampleCamera(journeyProgress.value).target} />;
}

export function DebugSlider() {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.001}
      defaultValue={journeyProgress.value}
      aria-label="Journey progress (debug)"
      onChange={(e) => (journeyProgress.value = e.currentTarget.valueAsNumber)}
      className="fixed bottom-4 left-4 z-50 w-72 accent-red-500"
    />
  );
}
