"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

export { segment } from "./segment";

type Props = {
  id: string;
  // Scroll length of the scene, in vh (the stage stays pinned for heightVh − 100).
  heightVh: number;
  background: string;
  // The header's ink over this scene: "dark" background → light header, "light" → navy header.
  headerTheme: "dark" | "light";
  // The scene's progress, 0–1, on every scroll update: write styles straight to the DOM here (no React state).
  // Not called with reduced motion: the scene then shows its resting layout.
  onProgress?: (p: number) => void;
  // "slide": the progress starts as the section enters from below (for a scene that slides in over the previous
  // one), not when its stage pins.
  from?: "pin" | "slide";
  className?: string;
  children: ReactNode;
};

// One journey scene (spec §6, "Cenas da jornada"): a section with its own scroll length and a 100svh sticky stage,
// its progress from one scrubbed ScrollTrigger.
export function Scene({ id, heightVh, background, headerTheme, onProgress, from = "pin", className = "", children }: Props) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // The latest callback, so the trigger isn't rebuilt on every render.
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    if (reduced) return;
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: from === "pin" ? "top top" : "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => callback.current?.(self.progress),
    });
    callback.current?.(trigger.progress);
    return () => trigger.kill();
  }, [reduced, from]);

  return (
    <section
      ref={section}
      id={id}
      data-header-theme={headerTheme}
      // Over the scene before it (z-10, in document order). A pinned scene bleeds 1 px of its background upwards:
      // where two scenes meet on a fractional pixel, the previous one's edge never shows as a line across the top (a
      // sliding scene must not: its picture continues the one under it).
      className={`relative z-10 ${className}`}
      style={{ height: `${heightVh}vh`, background, boxShadow: from === "pin" ? `0 -1px 0 ${background}` : undefined }}
    >
      <div className="sticky top-0 h-svh overflow-hidden">{children}</div>
    </section>
  );
}
