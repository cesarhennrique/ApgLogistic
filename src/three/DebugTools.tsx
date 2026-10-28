"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useState } from "react";
import { sampleCamera } from "./camera-path";
import { debugStats } from "./debugStats";
import { journeyProgress } from "./progress";

// Loaded only with ?debug, so production pays nothing when it is off.
export function DebugOrbit() {
  return <OrbitControls makeDefault target={sampleCamera(journeyProgress.value).target} />;
}

// Inside the canvas: copies renderer.info (last frame, shadow pass included) for the panel.
export function DebugProbe() {
  useFrame(({ gl }) => {
    debugStats.triangles = gl.info.render.triangles;
    debugStats.calls = gl.info.render.calls;
  });
  return null;
}

export function DebugSlider() {
  const [stats, setStats] = useState({ ...debugStats, progress: journeyProgress.value });
  // Debug only: a 4 Hz readout, not a per-frame render.
  useEffect(() => {
    const id = setInterval(() => setStats({ ...debugStats, progress: journeyProgress.value }), 250);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="font-mono-tabular fixed bottom-4 left-4 z-50 flex w-72 flex-col gap-2 bg-navy-900/80 p-3 text-xs text-sand-50">
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        defaultValue={journeyProgress.value}
        aria-label="Journey progress (debug)"
        onChange={(e) => (journeyProgress.value = e.currentTarget.valueAsNumber)}
        className="w-full accent-red-500"
      />
      <dl data-testid="debug-stats" className="grid grid-cols-2 gap-x-3">
        <dt>progress</dt>
        <dd>{stats.progress.toFixed(3)}</dd>
        <dt>triangles</dt>
        <dd data-testid="debug-triangles">{stats.triangles.toLocaleString("pt-BR")}</dd>
        <dt>draw calls</dt>
        <dd>{stats.calls}</dd>
        <dt>last env bake</dt>
        <dd data-testid="debug-bake">{stats.bakeMs === null ? "—" : `${stats.bakeMs.toFixed(1)} ms`}</dd>
      </dl>
    </div>
  );
}
