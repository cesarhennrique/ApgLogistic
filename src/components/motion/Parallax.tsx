"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

// A light parallax: its content drifts `distance` px (down, or across with axis x) as its section scrolls away
// (transform only, scrubbed). Not with reduced motion.
export function Parallax({
  children,
  className,
  distance = 60,
  axis = "y",
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  axis?: "x" | "y";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current!;
    const tween = gsap.fromTo(
      el,
      { [axis]: 0 },
      { [axis]: distance, ease: "none", scrollTrigger: { trigger: el.closest("section"), start: "top top", end: "bottom top", scrub: true } },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [reduced, distance, axis]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
