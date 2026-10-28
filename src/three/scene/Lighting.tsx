"use client";

import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type AmbientLight, type DirectionalLight, FogExp2, type HemisphereLight, Vector3 } from "three";
import { sampleCamera } from "../camera-path";
import { debugStats } from "../debugStats";
import { shouldRebake } from "../envBake";
import { sampleLight, sunDirection } from "../lightKeys";
import { journeyProgress } from "../progress";
import { SkyDome } from "./Sky";
import { skyUniforms } from "./skyShared";

// Cinema cheat: the light never grazes below 8°, so the ground still reads while the sky's sun sits on the horizon.
const MIN_LIGHT_ELEVATION = 8;
// The crane is 46 m tall and the CONE yard ~100 m across: a 100 m box, lit from 120 m out. Only ±60 m deep
// around the target: the low sun points down the journey, and a deeper box drags the next chapter's
// stacks into the shadow pass.
const SHADOW_DISTANCE = 120;
const SHADOW_HALF = 50;
const SHADOW_DEPTH = 60;

// One canvas, so per-frame scratch lives at module scope (no allocation, no hook values mutated).
const fog = new FogExp2(0x000000, 0);
const light = sampleLight(0);
const cam = { position: new Vector3(), target: new Vector3() };
const dir = new Vector3();

export function Lighting() {
  const sun = useRef<DirectionalLight>(null);
  const ambient = useRef<AmbientLight>(null);
  const hemi = useRef<HemisphereLight>(null);

  useFrame(({ gl, scene }) => {
    const p = journeyProgress.value;
    sampleLight(p, light);

    gl.toneMappingExposure = light.exposure;
    scene.environmentIntensity = light.envIntensity;
    fog.color.copy(light.fogColor);
    fog.density = light.fogDensity;

    skyUniforms.uSkyTop.value.copy(light.skyTop);
    skyUniforms.uSkyHorizon.value.copy(light.skyHorizon);
    skyUniforms.uSunColor.value.copy(light.sunColor);
    skyUniforms.uSunIntensity.value = light.sunIntensity;
    skyUniforms.uFogDensity.value = light.fogDensity;
    sunDirection(light.sunAzimuth, light.sunElevation, skyUniforms.uSunDir.value);

    // The shadow camera follows what the journey camera is looking at, so the current chapter casts shadows.
    sampleCamera(p, cam);
    sunDirection(light.sunAzimuth, Math.max(light.sunElevation, MIN_LIGHT_ELEVATION), dir);
    const s = sun.current!;
    s.position.copy(cam.target).addScaledVector(dir, SHADOW_DISTANCE);
    s.target.position.copy(cam.target);
    s.target.updateMatrixWorld();
    s.color.copy(light.sunColor);
    s.intensity = light.sunIntensity;

    ambient.current!.color.copy(light.ambientColor);
    ambient.current!.intensity = light.ambientIntensity;
    hemi.current!.color.copy(light.hemiSky);
    hemi.current!.groundColor.copy(light.hemiGround);
    hemi.current!.intensity = light.hemiIntensity;
  });

  return (
    <>
      <primitive object={fog} attach="fog" />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-camera-near={SHADOW_DISTANCE - SHADOW_DEPTH}
        shadow-camera-far={SHADOW_DISTANCE + SHADOW_DEPTH}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <ambientLight ref={ambient} />
      <hemisphereLight ref={hemi} />
      <SkyEnvironment />
    </>
  );
}

// Reflections come from the sky dome itself, so they follow each chapter's light (and cost zero bytes).
// With frames={1}, drei re-bakes the cube whenever this component re-renders: only when shouldRebake says so
// (the scroll has rested and the sky has changed), never mid-scroll.
function SkyEnvironment() {
  // The progress of the last bake. null: not yet; the first bake waits for Lighting's first frame (so the
  // cube isn't black) and for an idle page (it compiles shaders and must not land on hydration).
  const [bakedAt, setBakedAt] = useState<number | null>(null);
  const [idle, setIdle] = useState(false);
  // Frame-loop bookkeeping: last seen progress, when it last moved, the bake already asked for.
  const track = useRef({ progress: NaN, movedAt: 0, requested: null as number | null });
  useEffect(() => {
    const done = () => setIdle(true);
    // Safari has no requestIdleCallback.
    if (!("requestIdleCallback" in window)) {
      const id = setTimeout(done, 1500);
      return () => clearTimeout(id);
    }
    const id = requestIdleCallback(done, { timeout: 3000 });
    return () => cancelIdleCallback(id);
  }, []);
  useFrame(({ clock }) => {
    if (!idle) return;
    const t = track.current;
    const progress = journeyProgress.value;
    if (progress !== t.progress) {
      t.progress = progress;
      t.movedAt = clock.elapsedTime;
    }
    if (!shouldRebake({ progress, bakedAt: t.requested, stillFor: clock.elapsedTime - t.movedAt })) return;
    t.requested = progress;
    setBakedAt(progress);
  });
  if (bakedAt === null) return null;
  return (
    <>
      <BakeTimer phase="start" />
      <Environment frames={1} resolution={256}>
        <SkyDome />
      </Environment>
      <BakeTimer phase="end" key={bakedAt} />
    </>
  );
}

// Times a bake for the debug panel: the cube render (in the commit, between these two siblings' layout
// effects) plus the next frame's render, where three rebuilds the PMREM and recompiles env-mapped materials.
const bake = { start: 0, cube: 0, pending: false };
function BakeTimer({ phase }: { phase: "start" | "end" }) {
  useLayoutEffect(() => {
    if (phase === "start") bake.start = performance.now();
    else {
      bake.cube = performance.now() - bake.start;
      bake.pending = true;
    }
  });
  useFrame(({ scene }) => {
    if (phase === "start" || !bake.pending) return;
    bake.pending = false;
    const frameStart = performance.now();
    scene.onAfterRender = () => {
      debugStats.bakeMs = bake.cube + performance.now() - frameStart;
      scene.onAfterRender = () => {};
    };
  });
  return null;
}
