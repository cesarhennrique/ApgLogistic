"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3 } from "three";
import { sampleCamera } from "./camera-path";
import { journeyProgress } from "./progress";

const LAMBDA = 4;

function dampVector(current: Vector3, goal: Vector3, delta: number) {
  current.set(
    MathUtils.damp(current.x, goal.x, LAMBDA, delta),
    MathUtils.damp(current.y, goal.y, LAMBDA, delta),
    MathUtils.damp(current.z, goal.z, LAMBDA, delta),
  );
}

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const goal = useRef(sampleCamera(journeyProgress.value));
  const look = useRef<Vector3 | null>(null);

  useFrame(({ camera }, delta) => {
    sampleCamera(journeyProgress.value, goal.current);
    const { position, target } = goal.current;
    // First frame (and reduced motion) snaps; otherwise ease toward the path, never jumping.
    if (!look.current || reducedMotion) {
      camera.position.copy(position);
      look.current = (look.current ?? new Vector3()).copy(target);
    } else {
      dampVector(camera.position, position, delta);
      dampVector(look.current, target, delta);
    }
    camera.lookAt(look.current);
  });

  return null;
}
