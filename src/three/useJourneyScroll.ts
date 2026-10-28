"use client";

import { type RefObject, useEffect } from "react";
import { ScrollTrigger } from "@/components/motion/gsap";
import { readDebugParams } from "./debug";
import { journeyProgress } from "./progress";

// Maps the scroll through #journey-track to journeyProgress.value (0–1). ?p freezes it instead.
export function useJourneyScroll(trackRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const { frozen } = readDebugParams(window.location.search);
    if (frozen !== null) {
      journeyProgress.value = frozen;
      return;
    }
    const trigger = ScrollTrigger.create({
      trigger: trackRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => (journeyProgress.value = self.progress),
    });
    journeyProgress.value = trigger.progress;
    return () => trigger.kill();
  }, [trackRef]);
}
