"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Ocean, oceanTransform } from "@/components/journey/Ocean";
import { segment } from "@/components/journey/segment";
import { GRAIN } from "@/components/ui/grain";
import { readDebugParams } from "@/three/debug";
import { heroDive } from "@/three/progress";

const HeroCanvas = dynamic(() => import("@/three/HeroCanvas"), { ssr: false });

// Over the dive (0–1): the copy leaves first, the ocean of scene 1 covers the map at the end.
const COPY_OUT = [0, 0.2] as const;
const OCEAN_IN = [0.7, 1] as const;

// The hero's sticky stage: the 3D map (its canvas only, loaded after the page), the copy, and the ocean the dive
// lands in. The dive runs from the top of the hero until scene 1 starts sliding in over it (the hero's bottom at
// 200% of the viewport: scene 1 overlaps the hero's last screen).
export function HeroStage({ children }: { children: ReactNode }) {
  const copy = useRef<HTMLDivElement>(null);
  const ocean = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);
  const reduced = useReducedMotion();

  // The 3D chunk (three, drei, postprocessing) loads after the page's load event and an idle moment, off the
  // LCP's path; the first-visit loader covers the wait.
  useEffect(() => {
    const go = () => setCanvas(true);
    const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1000 }) : setTimeout(go, 100));
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }, []);

  useEffect(() => {
    const apply = (d: number) => {
      heroDive.value = d;
      const out = segment(d, ...COPY_OUT);
      copy.current!.style.opacity = String(1 - out);
      copy.current!.style.transform = `translate3d(0, ${(-out * 6).toFixed(2)}vh, 0)`;
      copy.current!.style.visibility = out >= 1 ? "hidden" : "";
      ocean.current!.style.opacity = String(segment(d, ...OCEAN_IN));
    };
    const { frozen } = readDebugParams(window.location.search);
    if (frozen !== null) return apply(frozen);
    if (reduced) return apply(0);
    const trigger = ScrollTrigger.create({
      trigger: document.getElementById("hero"),
      start: "top top",
      end: "bottom 200%",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });
    apply(trigger.progress);
    return () => trigger.kill();
  }, [reduced]);

  return (
    <div className="sticky top-0 isolate h-svh overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {/* the backdrop until the canvas fades in (the canvas adds its own grain) */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
        {canvas && <HeroCanvas />}
        <div ref={ocean} className="absolute inset-0 opacity-0" style={{ transform: oceanTransform(0) }}>
          <Ocean />
        </div>
      </div>
      <div ref={copy} className="flex h-full flex-col">
        {children}
      </div>
    </div>
  );
}
