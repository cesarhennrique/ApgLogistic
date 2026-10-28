"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { NAVIGATE_EVENT } from "@/components/layout/PageCurtain";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { CameraRig } from "./CameraRig";
import { sampleCamera } from "./camera-path";
import { readDebugParams } from "./debug";
import { Placeholders } from "./Placeholders";
import { journeyProgress } from "./progress";
import { Lighting } from "./scene/Lighting";
import { Ocean } from "./scene/Ocean";
import { Sky } from "./scene/Sky";

const DebugOrbit = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugOrbit })));
const DebugSlider = lazy(() => import("./DebugTools").then((m) => ({ default: m.DebugSlider })));

// Client-only (next/dynamic ssr:false). Lives in the sticky layer of #journey.
export default function JourneyCanvas() {
  const reducedMotion = useReducedMotion();
  const [{ debug }] = useState(() => readDebugParams(window.location.search));
  const [ready, setReady] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [leaving, setLeaving] = useState(false);

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
          shadows
          frameloop={onScreen && !leaving ? "always" : "never"}
          camera={{ fov: 40, near: 0.1, far: 400, position: sampleCamera(journeyProgress.value).position }}
          onCreated={({ gl }) => {
            // Exposure follows the journey (Lighting, from sampleLight).
            gl.toneMapping = ACESFilmicToneMapping;
            gl.outputColorSpace = SRGBColorSpace;
            setReady(true);
          }}
        >
          <Lighting />
          <Sky />
          <Suspense fallback={null}>
            <Ocean reducedMotion={reducedMotion} />
          </Suspense>
          <Placeholders />
          {debug ? (
            <Suspense fallback={null}>
              <DebugOrbit />
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
