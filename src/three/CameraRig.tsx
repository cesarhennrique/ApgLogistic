"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { sampleCamera } from "./camera-path";
import { journeyProgress } from "./progress";

const LAMBDA = 4;

// Hero breathing: a slow drift that keeps the frame alive before the scroll starts.
const BREATH_PERIOD = 12;
const BREATH_DRIFT = 0.3;
const BREATH_ROLL = MathUtils.degToRad(0.5);
// Fades out over the first few percent of scroll, so leaving the hero never jumps.
const BREATH_FADE = 0.03;

function dampVector(current: Vector3, goal: Vector3, delta: number) {
  current.set(
    MathUtils.damp(current.x, goal.x, LAMBDA, delta),
    MathUtils.damp(current.y, goal.y, LAMBDA, delta),
    MathUtils.damp(current.z, goal.z, LAMBDA, delta),
  );
}

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const goal = useRef(sampleCamera(journeyProgress.value));
  // The rig's own state; the camera is this plus the breathing, so the drift never feeds back into the damping.
  const rig = useRef<{ position: Vector3; look: Vector3 } | null>(null);

  useFrame(({ camera, clock }, delta) => {
    sampleCamera(journeyProgress.value, goal.current);
    const { position, target } = goal.current;
    // First frame (and reduced motion) snaps; otherwise ease toward the path, never jumping.
    if (!rig.current) {
      rig.current = { position: position.clone(), look: target.clone() };
    } else if (reducedMotion) {
      rig.current.position.copy(position);
      rig.current.look.copy(target);
    } else {
      dampVector(rig.current.position, position, delta);
      dampVector(rig.current.look, target, delta);
    }
    camera.position.copy(rig.current.position);
    camera.lookAt(rig.current.look);

    if (reducedMotion) return;
    const weight = 1 - MathUtils.smoothstep(journeyProgress.value, 0, BREATH_FADE);
    if (weight === 0) return;
    // Added after lookAt, on top of the rig: the path stays the source of truth.
    const a = (clock.elapsedTime / BREATH_PERIOD) * Math.PI * 2;
    camera.translateX(Math.sin(a) * BREATH_DRIFT * weight);
    camera.translateY(Math.sin(2 * a + 1) * BREATH_DRIFT * 0.5 * weight);
    camera.rotateZ(Math.sin(a + 0.6) * BREATH_ROLL * weight);
  });

  return null;
}
