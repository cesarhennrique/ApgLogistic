"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

// A light parallax: its content drifts down `distance` px as its section scrolls away (transform only, scrubbed).
// Not with reduced motion.
export function Parallax({ children, className, distance = 60 }: { children: ReactNode; className?: string; distance?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current!;
    const tween = gsap.fromTo(
      el,
      { y: 0 },
      { y: distance, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top top", end: "bottom top", scrub: true } },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced, distance]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
