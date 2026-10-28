"use client";

import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { type AmbientLight, type DirectionalLight, FogExp2, type HemisphereLight, Vector3 } from "three";
import { sampleCamera } from "../camera-path";
import { sampleLight, sunDirection } from "../lightKeys";
import { journeyProgress } from "../progress";
import { SkyDome } from "./Sky";
import { skyUniforms } from "./skyShared";

// Cinema cheat: the light never grazes below 8°, so the ground still reads while the sky's sun sits on the horizon.
const MIN_LIGHT_ELEVATION = 8;
const SHADOW_DISTANCE = 80;
const SHADOW_HALF = 32;

// Re-render the reflection cube only after this much progress: the sky barely changes in between.
const ENV_STEP = 0.02;

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
        shadow-camera-near={1}
        shadow-camera-far={SHADOW_DISTANCE * 2}
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
// With frames={1}, drei re-renders the cube whenever this component re-renders: at most once per ENV_STEP.
function SkyEnvironment() {
  // -1: mount only after Lighting has filled the sky uniforms (so the first cube isn't black), and only once
  // the page is idle: the first bake compiles shaders and must not land on hydration or the first scroll.
  const [step, setStep] = useState(-1);
  const [idle, setIdle] = useState(false);
  // Guards against repeat calls before the re-render lands: each one could re-render (and re-bake) again.
  const requested = useRef(-1);
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
  useFrame(() => {
    if (!idle) return;
    const next = Math.round(journeyProgress.value / ENV_STEP);
    if (next === requested.current) return;
    requested.current = next;
    setStep(next);
  });
  if (step === -1) return null;
  return (
    <Environment frames={1} resolution={256}>
      <SkyDome />
    </Environment>
  );
}
