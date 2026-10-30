"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { introBridge, subscribeCovered } from "@/components/intro/bridge";
import { NAVIGATE_EVENT } from "@/components/layout/PageCurtain";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Backdrop } from "./blueprint/Backdrop";
import { Effects } from "./blueprint/Effects";
import { CameraRig } from "./CameraRig";
import { readDebugParams } from "./debug";
import { LoadProbe } from "./LoadProbe";
import { journeyProgress } from "./progress";
import { sampleStageCamera } from "./stages/camera";
import { Stages } from "./stages/Stages";

const DebugOrbit = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugOrbit })));
const DebugSlider = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugSlider })));
const DebugProbe = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugProbe })));

// Client-only (next/dynamic ssr:false). Lives in the sticky layer of #journey.
export default function JourneyCanvas() {
  const reducedMotion = useReducedMotion();
  const [{ debug }] = useState(() => readDebugParams(window.location.search));
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const covered = useSyncExternalStore(
    subscribeCovered,
    () => introBridge.covered,
    () => false,
  );

  // Stop rendering once #journey leaves the viewport.
  useEffect(() => {
    const journey = document.getElementById("journey");
    if (!journey) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(journey);
    return () => io.disconnect();
  }, []);

  // A page transition is underway and Home is about to unmount: free the main thread for it.
  useEffect(() => {
    const stop = () => setLeaving(true);
    window.addEventListener(NAVIGATE_EVENT, stop);
    return () => window.removeEventListener(NAVIGATE_EVENT, stop);
  }, []);

  return (
    <>
      <div
        className={`absolute inset-0 transition-opacity duration-600 ease-out motion-reduce:transition-none ${ready ? "opacity-100" : "opacity-0"}`}
      >
        <Canvas
          dpr={[1, 2]}
          // Under the first-visit loader, only the frames asked for (the hero map's first one).
          frameloop={onScreen && !leaving ? (covered ? "demand" : "always") : "never"}
          // Unlit drawing in exact brand colors: no tone mapping anywhere; SMAA (Effects) replaces MSAA.
          flat
          gl={{ antialias: false }}
          // Stages sit 1 km apart and the shots reach ~200 m: a deep but bounded frustum.
          camera={{ fov: 35, near: 0.5, far: 2500, position: sampleStageCamera(journeyProgress.value).position }}
          onCreated={() => setReady(true)}
        >
          <LoadProbe />
          <Backdrop />
          <Stages reducedMotion={reducedMotion} />
          <Effects />
          {debug ? (
            <Suspense fallback={null}>
              <DebugOrbit />
              <DebugProbe />
            </Suspense>
          ) : (
            <CameraRig reducedMotion={reducedMotion} />
          )}
        </Canvas>
      </div>
      {debug && (
        <Suspense fallback={null}>
          <DebugSlider />
        </Suspense>
      )}
    </>
  );
}
