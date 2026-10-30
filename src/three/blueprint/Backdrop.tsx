"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color } from "three";
import { journeyProgress } from "../progress";
import { stageBackground } from "../stages/background";
import { applyTheme, ink } from "./ink";

const background = new Color();

// The drawing board: the stage's solid background and the inks that go with it (theme), both from the progress,
// written only when it changes; and the canvas size the px line widths are measured in.
export function Backdrop() {
  const last = useRef(NaN);
  useFrame(({ scene, size }) => {
    ink.resolution.value.set(size.width, size.height);
    const p = journeyProgress.value;
    if (p === last.current) return;
    last.current = p;
    scene.background = stageBackground(p, background);
    applyTheme(p);
  });
  return null;
}
