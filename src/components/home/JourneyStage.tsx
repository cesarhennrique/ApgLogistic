"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Color } from "three";
import { gsap } from "@/components/motion/gsap";
import { GRAIN } from "@/components/ui/grain";
import { journeyProgress } from "@/three/progress";
import { stageBackground } from "@/three/stages/background";

const JourneyCanvas = dynamic(() => import("@/three/JourneyCanvas"), { ssr: false });


// Spans all of #journey; the inner layer sticks for its whole height, then scrolls away with it.
export function JourneyStage() {
  const stage = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);

  // The 3D chunk (three, drei, postprocessing) loads after the page's load event and an idle moment, off the
  // LCP's path; the first-visit loader covers the wait.
  useEffect(() => {
    const go = () => setCanvas(true);
    const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1000 }) : setTimeout(go, 100));
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }, []);

  // The stage's color under the canvas follows the 3D background (stageBackground), so the page shows the
  // same color before the canvas fades in. Exit: from 0.95 to 1 the scene sinks into navy-900 and the page
  // carries on below. Read from the same progress as the 3D; written only when it changes.
  useEffect(() => {
    let last = -1;
    const color = new Color();
    const tick = () => {
      const p = journeyProgress.value;
      if (p === last) return;
      last = p;
      stage.current!.style.backgroundColor = stageBackground(p, color).getStyle();
      const t = Math.min(Math.max((p - 0.95) / 0.05, 0), 1);
      exit.current!.style.opacity = String(t * t * (3 - 2 * t));
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden bg-navy-900">
        {/* the backdrop until the canvas fades in (the canvas adds its own grain) */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        {canvas && <JourneyCanvas />}
        <div ref={exit} className="pointer-events-none absolute inset-0 bg-navy-900 opacity-0" />
      </div>
    </div>
  );
}
