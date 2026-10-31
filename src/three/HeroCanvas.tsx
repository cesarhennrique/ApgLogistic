"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { introBridge, subscribeCovered } from "@/components/intro/bridge";
import { NAVIGATE_EVENT } from "@/components/layout/PageCurtain";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { CameraRig } from "./CameraRig";
import { readDebugParams } from "./debug";
import { LoadProbe } from "./LoadProbe";
import { heroDive } from "./progress";
import { HeroMapStage } from "./stages/HeroMapStage";
import { sampleHeroCamera } from "./stages/heroCamera";

const DebugOrbit = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugOrbit })));
const DebugSlider = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugSlider })));
const DebugProbe = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugProbe })));

// Client-only (next/dynamic ssr:false). The only canvas on the page: the hero's map, in the hero's sticky stage.
export default function HeroCanvas() {
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

  // Stop rendering once the hero leaves the viewport.
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(hero);
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
          // Unlit lines and dots in exact brand colors: no tone mapping. See-through, over the hero's photo (no post
          // effects: they would flatten the alpha), so MSAA for the lines.
          flat
          gl={{ antialias: true, alpha: true }}
          camera={{ fov: 35, near: 0.5, far: 1000, position: sampleHeroCamera(heroDive.value).position }}
          onCreated={() => setReady(true)}
        >
          <LoadProbe />
          <HeroMapStage reducedMotion={reducedMotion} />
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
