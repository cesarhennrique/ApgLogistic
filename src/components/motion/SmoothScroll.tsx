"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

// Shared so the menu can pause scrolling; null when Lenis is off: reduced motion, or a touch screen (its own scroll is
// native, async, and Lenis would only add work per frame there).
export const lenisRef: { current: Lenis | null } = { current: null };

export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // a phone's address bar resizing the viewport as it scrolls: no full refresh of every trigger for that
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    const lenis = new Lenis();
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  return null;
}
