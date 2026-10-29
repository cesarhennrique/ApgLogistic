"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, type DirectionalLight, PMREMGenerator, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { journeyProgress } from "../progress";
import { stageBackground } from "../stages/background";
import { sampleStageCamera } from "../stages/camera";
import { untoneMap } from "./toneMap";

// Studio light, the same on every stage: a soft key at ~45° (the only shadow caster), a weak cold fill, and a rim
// from behind. They ride along with the shot (each stage sits on its own origin).
const KEY = new Vector3(1, 1.25, 0.8).normalize();
const FILL = new Vector3(-1, 0.45, 0.6).normalize();
const RIM = new Vector3(-0.35, 0.9, -1).normalize();
const DISTANCE = 120;
const SHADOW_HALF = 70;

const shot = sampleStageCamera(0);
const sceneBackground = new Color();
const brand = new Color();

export function Studio() {
  const get = useThree((s) => s.get);
  const key = useRef<DirectionalLight>(null);
  const fill = useRef<DirectionalLight>(null);
  const rim = useRef<DirectionalLight>(null);
  const lastProgress = useRef(NaN);

  // Reflections from three's RoomEnvironment, prefiltered once (0 bytes of assets).
  useEffect(() => {
    const { gl, scene } = get();
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.7;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [get]);

  useFrame(({ scene }) => {
    const p = journeyProgress.value;
    sampleStageCamera(p, shot);
    for (const [light, dir] of [
      [key.current!, KEY],
      [fill.current!, FILL],
      [rim.current!, RIM],
    ] as const) {
      light.position.copy(shot.target).addScaledVector(dir, DISTANCE);
      light.target.position.copy(shot.target);
      light.target.updateMatrixWorld();
    }
    // Solid brand background, solved backwards through the tone mapping so it lands on the exact color.
    if (p !== lastProgress.current) {
      lastProgress.current = p;
      stageBackground(p, brand);
      scene.background = untoneMap([brand.r, brand.g, brand.b], sceneBackground);
    }
  });

  return (
    <>
      <directionalLight
        ref={key}
        color="#fff6ec"
        intensity={2.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-camera-near={1}
        shadow-camera-far={DISTANCE * 2.5}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <directionalLight ref={fill} color="#c4d2ff" intensity={0.35} />
      <directionalLight ref={rim} color="#ffffff" intensity={1.4} />
    </>
  );
}
