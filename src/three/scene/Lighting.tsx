"use client";

import { Environment } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { type AmbientLight, type DirectionalLight, FogExp2, type HemisphereLight, Vector3 } from "three";
import { sampleCamera } from "../camera-path";
import { LIGHT_KEYS, sampleLight, sunDirection } from "../lightKeys";
import { journeyProgress } from "../progress";
import { skyUniforms } from "./skyShared";

// Cinema cheat: the light never grazes below 8°, so the ground still reads while the sky's sun sits on the horizon.
const MIN_LIGHT_ELEVATION = 8;
const SHADOW_DISTANCE = 80;
const SHADOW_HALF = 32;

// The HDRI's sun sits at u ≈ 0.6 of the equirect (atan2(z, x) ≈ 0.626 rad); turn it onto the sunset sun.
const HDRI_SUN_ANGLE = 0.626;
const heroSun = sunDirection(LIGHT_KEYS[0].sunAzimuth, 0);
const HDRI_ROTATION = HDRI_SUN_ANGLE - Math.atan2(heroSun.z, heroSun.x);

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
      {/* Reflections only: the visible sky is the Sky dome. */}
      <Suspense fallback={null}>
        <Environment files="/3d/hdri/sunset-1k.hdr" environmentRotation={[0, HDRI_ROTATION, 0]} />
      </Suspense>
    </>
  );
}
