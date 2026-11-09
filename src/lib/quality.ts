"use client";

import { useSyncExternalStore } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

// The site's quality tier (spec §6): 'static' draws no canvas at all (the maps as still pictures), 'low' keeps the
// maps but lighter (dpr ≤ 1.5, no pulsing routes, no blurred crane copy, the journey's images a width down and picked
// as if at 2× at most), 'high' is everything. Phones are 'low': iOS kills a tab past its memory budget.
export type Tier = "static" | "low" | "high";

type Device = { webgl: boolean; saveData: boolean; lowMemory: boolean; phone: boolean };

export function pickTier({ webgl, reducedMotion, saveData, lowMemory, phone }: Device & { reducedMotion: boolean }): Tier {
  if (!webgl || reducedMotion) return "static";
  if (saveData || lowMemory || phone) return "low";
  return "high";
}

// The device's side of it, read once in the browser: WebGL at all, the data saver, little memory (deviceMemory ≤ 4),
// a phone (a coarse pointer first, or iOS: iPads ask for the desktop site but share the budget).
let device: Device | null = null;
function readDevice() {
  if (device) return device;
  let webgl = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webgl = !!gl;
    // the probe's context let go at once (a live one counts against the page's few)
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {}
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const phone = ios || window.matchMedia("(pointer: coarse)").matches;
  device = { webgl, saveData: !!nav.connection?.saveData, lowMemory: (nav.deviceMemory ?? 8) <= 4, phone };
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
