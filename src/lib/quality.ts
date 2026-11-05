"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

// The site's quality tier (spec §6): 'static' draws no canvas at all (the maps as still pictures), 'low' keeps the
// maps but lighter (dpr ≤ 1.5, no pulsing routes, no blurred crane copy, the journey's images a width down), 'high'
// is everything.
export type Tier = "static" | "low" | "high";

export function pickTier({ webgl, reducedMotion, saveData, lowMemory }: { webgl: boolean; reducedMotion: boolean; saveData: boolean; lowMemory: boolean }): Tier {
  if (!webgl || reducedMotion) return "static";
  if (saveData || lowMemory) return "low";
  return "high";
}

// The device's side of it, read once in the browser: WebGL at all, the data saver, little memory (deviceMemory ≤ 4).
let device: { webgl: boolean; saveData: boolean; lowMemory: boolean } | null = null;
function readDevice() {
  if (device) return device;
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    webgl = !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {}
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  device = { webgl, saveData: !!nav.connection?.saveData, lowMemory: (nav.deviceMemory ?? 8) <= 4 };
  return device;
}

const noop = () => () => {};

// The tier, or null before the page hydrates (the server knows nothing of the device: render as if 'high', mount no
// canvas yet).
export function useQualityTier(): Tier | null {
  const reducedMotion = useReducedMotion();
  const ready = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  return ready ? pickTier({ ...readDevice(), reducedMotion }) : null;
}
