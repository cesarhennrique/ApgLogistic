"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { sampleHeroCamera } from "./stages/heroCamera";
import { debugStats } from "./debugStats";
import { heroDive } from "./progress";

// Loaded only with ?debug, so production pays nothing when it is off.
export function DebugOrbit() {
  return <OrbitControls makeDefault target={sampleHeroCamera(heroDive.value).target} />;
}

// Inside the canvas: copies renderer.info for the panel. The post passes reset it per render, so it accumulates
// the whole last frame (shadow and post passes included) and resets here, before the next one renders.
export function DebugProbe() {
  useFrame(({ gl }) => {
    gl.info.autoReset = false;
    debugStats.triangles = gl.info.render.triangles;
    debugStats.calls = gl.info.render.calls;
    gl.info.reset();
  }, -1);
  return null;
}

export function DebugSlider() {
  const [stats, setStats] = useState({ ...debugStats, progress: heroDive.value });
  // Debug only: a 4 Hz readout, not a per-frame render.
  useEffect(() => {
    const id = setInterval(() => setStats({ ...debugStats, progress: heroDive.value }), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono-tabular fixed bottom-4 left-4 z-50 flex w-72 flex-col gap-2 bg-navy-900/80 p-3 text-xs text-sand-50">
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        defaultValue={heroDive.value}
        aria-label="Journey progress (debug)"
        onChange={(e) => (heroDive.value = e.currentTarget.valueAsNumber)}
        className="w-full accent-red-500"
      />
      <dl data-testid="debug-stats" className="grid grid-cols-2 gap-x-3">
        <dt>progress</dt>
        <dd>{stats.progress.toFixed(3)}</dd>
        <dt>triangles</dt>
        <dd data-testid="debug-triangles">{stats.triangles.toLocaleString("pt-BR")}</dd>
        <dt>draw calls</dt>
        <dd>{stats.calls}</dd>
      </dl>
    </div>
  );
}
