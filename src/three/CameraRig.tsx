"use client";

import { useFrame } from "@react-three/fiber";
import { MathUtils, type PerspectiveCamera, Vector3 } from "three";
import { journeyProgress } from "./progress";
import { sampleStageCamera } from "./stages/camera";

// The hero's slow orbit: ±6° about the map's vertical axis, a 20 s cycle, fading out as the dive begins.
const ORBIT = MathUtils.degToRad(6);
const ORBIT_PERIOD = 20;
const ORBIT_FADE = 0.03;
const Y = new Vector3(0, 1, 0);

// The keys are framed for 16:10. Narrower screens keep that horizontal view (up to 75° vertical) instead of
// cropping the sides, where Suape and the routes sit.
const FRAME_ASPECT = 1.6;
const MAX_FOV = 75;
const fitFov = (fov: number, aspect: number) =>
  aspect >= FRAME_ASPECT
    ? fov
    : Math.min(MAX_FOV, MathUtils.radToDeg(2 * Math.atan((Math.tan(MathUtils.degToRad(fov) / 2) * FRAME_ASPECT) / aspect)));

const pose = sampleStageCamera(0);
const offset = new Vector3();

// Follows the stage cameras (sampleStageCamera): no damping of its own, Lenis already smooths the scroll and the
// path is continuous in position and speed.
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  useFrame(({ camera, clock }) => {
    const p = journeyProgress.value;
    sampleStageCamera(p, pose);
    const weight = reducedMotion ? 0 : 1 - MathUtils.smoothstep(p, 0, ORBIT_FADE);
    if (weight > 0) {
      const angle = ORBIT * Math.sin((2 * Math.PI * clock.elapsedTime) / ORBIT_PERIOD) * weight;
      offset.subVectors(pose.position, pose.target).applyAxisAngle(Y, angle);
      pose.position.copy(pose.target).add(offset);
    }
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    const perspective = camera as PerspectiveCamera;
    const fov = fitFov(pose.fov, perspective.aspect);
    if (perspective.fov !== fov) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}
