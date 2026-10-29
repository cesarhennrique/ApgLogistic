"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { site } from "@/content/site";
import { trackChapterAt } from "@/three/chapters";
import { journeyProgress } from "@/three/progress";
import { stageBackground } from "@/three/stages/background";
import { STAGE_SPANS } from "@/three/stages/timeline";
import { useJourneyScroll } from "@/three/useJourneyScroll";

// Chapters 1–5; chapter 0's text is the Hero itself.
const chapters = site.journey.filter((c) => c.id !== "hero");

// Navy text on the sand stages, sand on the navy ones: each chapter's stage color, read mid-span.
const onSand = (id: (typeof chapters)[number]["id"]) => stageBackground((STAGE_SPANS[id][0] + STAGE_SPANS[id][1]) / 2).r > 0.5;

export function JourneyTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<HTMLDivElement>(null);
  useJourneyScroll(trackRef);

  // Reads the same progress as the 3D (scroll, ?p or the debug slider); touches the DOM only on chapter change.
  useEffect(() => {
    let current: string | null = null;
    const tick = () => {
      const id = trackChapterAt(journeyProgress.value);
      if (id === current) return;
      current = id;
      for (const el of textsRef.current!.children) {
        el.toggleAttribute("data-active", (el as HTMLElement).dataset.chapter === id);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div id="journey-track" ref={trackRef} className="relative h-[600vh]">
      <div className="sticky top-0 flex h-svh items-end">
        <div ref={textsRef} className="site-container grid w-full pb-16 md:pb-24">
          {chapters.map((c) => (
            <p
              key={c.id}
              data-chapter={c.id}
              className={`${onSand(c.id) ? "text-navy-900" : "text-sand-50"} font-condensed col-start-1 row-start-1 max-w-[12em] translate-y-6 text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.92] font-bold tracking-[-0.01em] uppercase opacity-0 transition-[opacity,transform] duration-500 ease-out data-active:translate-y-0 data-active:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none`}
            >
              {c.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
