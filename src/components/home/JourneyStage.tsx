"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { journeyProgress } from "@/three/progress";

const JourneyCanvas = dynamic(() => import("@/three/JourneyCanvas"), { ssr: false });

// Film grain over the gradient (feTurbulence). The gradient is the backdrop until the canvas fades in.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Spans all of #journey; the inner layer sticks for its whole height, then scrolls away with it.
export function JourneyStage() {
  const exit = useRef<HTMLDivElement>(null);

  // Exit: from 0.95 to 1 the scene sinks into navy-900, the stage's own color, and the page carries on below.
  // Opacity only, read from the same progress as the 3D; written only when it changes.
  useEffect(() => {
    let last = -1;
    const tick = () => {
      const p = journeyProgress.value;
      const t = Math.min(Math.max((p - 0.95) / 0.05, 0), 1);
      const o = t * t * (3 - 2 * t);
      if (o === last) return;
      last = o;
      exit.current!.style.opacity = String(o);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="sticky top-0 h-svh overflow-hidden bg-linear-to-br from-navy-900 from-35% to-blue-600">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <JourneyCanvas />
        <div ref={exit} className="pointer-events-none absolute inset-0 bg-navy-900 opacity-0" />
      </div>
    </div>
  );
}
