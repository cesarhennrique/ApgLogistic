"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { MathUtils, type PerspectiveCamera, Vector3 } from "three";
import { heroDive } from "./progress";
import { HERO_KEYS, sampleHeroCamera } from "./stages/heroCamera";
import { fitHeroFrame, type Rect } from "./stages/heroFrame";

// The hero's slow orbit: ±6° about the map's vertical axis, a 20 s cycle, fading out over the first third of the
// dive.
const ORBIT = MathUtils.degToRad(6);
const ORBIT_PERIOD = 20;
const ORBIT_FADE = 0.3;
const Y = new Vector3(0, 1, 0);
// "SUAPE · PE" sits right of Suape, on the coast: room for it.
const SUAPE_LABEL = 110;

// The opening shot is refitted to the viewport (heroFrame): the map is the hero's centrepiece, large: on landscape
// screens right of the copy (#hero-copy), from ~12% to ~78% of the height; on portrait ones the width above the copy.
// Short of the room Suape's label needs at the right.
const HERO_START = HERO_KEYS.start;
const START_POSITION = new Vector3(...HERO_START.position);
const START_TARGET = new Vector3(...HERO_START.target);
const DIRECTION = START_POSITION.clone().sub(START_TARGET).normalize();
const fit = { position: new Vector3(), target: new Vector3(), offsetX: 0, offsetY: 0, ready: false };

function freeRegion(width: number, height: number): Rect {
  const md = width >= 768;
  const header = md ? 80 : 64;
  const margin = MathUtils.clamp(width * 0.04, 16, 64);
  const copy = document.getElementById("hero-copy")?.getBoundingClientRect();
  if (width >= height) {
    const left = Math.max((copy?.right ?? 0) + 40, 0.42 * width);
    return { left, right: width - margin - SUAPE_LABEL, top: Math.max(0.12 * height, header + 8), bottom: 0.78 * height };
  }
  // The hero sits at the top of the page: its layout box, as at scroll 0.
  const top = copy ? copy.top + window.scrollY : height / 2;
  // (never less than 22% of the screen: on a short phone the copy fills most of it)
  return { left: margin, right: width - margin - SUAPE_LABEL, top: header + 8, bottom: Math.max(Math.min(top - 16, 0.4 * height), header + 0.22 * height) };
}

const pose = sampleHeroCamera(0);
const offset = new Vector3();

// Follows the dive (sampleHeroCamera): no damping of its own, Lenis already smooths the scroll and the path is
// continuous in position and speed.
export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  // Refit on resize and whenever the copy's box changes (fonts, wrapping).
  useEffect(() => {
    const refit = () => {
      const frame = fitHeroFrame({ width, height, region: freeRegion(width, height), direction: DIRECTION, fov: HERO_START.fov });
      fit.position.copy(frame.position).sub(START_POSITION);
      fit.target.copy(frame.target).sub(START_TARGET);
      fit.offsetX = frame.offsetX;
      fit.offsetY = frame.offsetY;
      fit.ready = true;
    };
    refit();
    const copy = document.getElementById("hero-copy");
    if (!copy) return;
    const observer = new ResizeObserver(refit);
    observer.observe(copy);
    return () => observer.disconnect();
  }, [width, height]);

  useFrame(({ camera, clock }) => {
    const p = heroDive.value;
    sampleHeroCamera(p, pose);
    const hero = fit.ready ? 1 - MathUtils.smoothstep(p, 0, 1) : 0;
    if (hero > 0) {
      pose.position.addScaledVector(fit.position, hero);
      pose.target.addScaledVector(fit.target, hero);
    }
    const weight = reducedMotion ? 0 : 1 - MathUtils.smoothstep(p, 0, ORBIT_FADE);
    if (weight > 0) {
      const angle = ORBIT * Math.sin((2 * Math.PI * clock.elapsedTime) / ORBIT_PERIOD) * weight;
      offset.subVectors(pose.position, pose.target).applyAxisAngle(Y, angle);
      pose.position.copy(pose.target).add(offset);
    }
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    const perspective = camera as PerspectiveCamera;
    const fov = pose.fov;
    if (hero > 0) {
      perspective.fov = fov;
      perspective.setViewOffset(width, height, fit.offsetX * hero, fit.offsetY * hero, width, height);
    } else if (perspective.view?.enabled) {
      perspective.fov = fov;
      perspective.clearViewOffset();
    } else if (perspective.fov !== fov) {
      perspective.fov = fov;
      perspective.updateProjectionMatrix();
    }
  });

  return null;
}
