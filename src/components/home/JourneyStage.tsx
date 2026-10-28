"use client";

import dynamic from "next/dynamic";

const JourneyCanvas = dynamic(() => import("@/three/JourneyCanvas"), { ssr: false });

// Film grain over the gradient (feTurbulence). The gradient is the backdrop until the canvas fades in.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Spans all of #journey; the inner layer sticks for its whole height, then scrolls away with it.
export function JourneyStage() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="sticky top-0 h-svh overflow-hidden bg-linear-to-br from-navy-900 from-35% to-blue-600">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        <JourneyCanvas />
      </div>
    </div>
  );
}
