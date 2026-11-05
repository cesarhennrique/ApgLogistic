"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { type PhoneScroll, phoneLength, toDesktop } from "./sceneScroll";

export { segment } from "./segment";

type Props = {
  id: string;
  // Scroll length of the scene, in vh (the stage stays pinned for heightVh − 100).
  heightVh: number;
  // Phones scroll the scene shorter (below md): its progress range scaled by `scale`, but for its first `head` and
  // last `tail` vh (a slide in over the scene before, a hold under the next one's), which stay a screen each. The
  // progress handed to onProgress is the desktop one either way.
  phone?: PhoneScroll;
  background: string;
  // The header's ink over this scene: "dark" background → light header, "light" → navy header.
  headerTheme: "dark" | "light";
  // The scene's progress, 0–1, on every scroll update: write styles straight to the DOM here (no React state).
  // Not called with reduced motion: the scene then shows its resting layout, a screen high. top: where the section's
  // top is on screen (px), from the trigger's own numbers: no layout read per frame.
  onProgress?: (p: number, top: number) => void;
  // "slide": the progress starts as the section enters from below (for a scene that slides in over the previous
  // one, overlapping its last screen), not when its stage pins.
  from?: "pin" | "slide";
  className?: string;
  children: ReactNode;
};

// One journey scene (spec §6, "Cenas da jornada"): a section with its own scroll length and a 100svh sticky stage,
// its progress from one scrubbed ScrollTrigger.
export function Scene({ id, heightVh, phone, background, headerTheme, onProgress, from = "pin", className = "", children }: Props) {
  const section = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  // The latest callback, so the trigger isn't rebuilt on every render.
  const callback = useRef(onProgress);
  useEffect(() => {
    callback.current = onProgress;
  });
  const range = from === "pin" ? heightVh - 100 : heightVh;
  const phoneHeight = phone && phoneLength(range, phone) + (from === "pin" ? 100 : 0);

  useEffect(() => {
    if (reduced) return;
    const progress = (p: number) => (phone && window.innerWidth < 768 ? toDesktop(p, range, phone) : p);
    // the trigger starts with the section's top at the viewport's bottom (slide) or top (pin)
    const topOf = (self: ScrollTrigger) => (from === "slide" ? window.innerHeight : 0) - (self.scroll() - self.start);
    const trigger = ScrollTrigger.create({
      trigger: section.current,
      start: from === "pin" ? "top top" : "top bottom",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => callback.current?.(progress(self.progress), topOf(self)),
    });
    callback.current?.(progress(trigger.progress), topOf(trigger));
    return () => trigger.kill();
  }, [reduced, from, phone, range]);

  return (
    <section
      ref={section}
      id={id}
      data-header-theme={headerTheme}
      // The scroll's shape, for the e2e tests to find a progress on any screen: range, from, head, tail, scale.
      data-scroll={[range, from, phone?.head ?? 0, phone?.tail ?? 0, phone?.scale ?? 1].join(" ")}
      // Over the scene before it (z-10, in document order); a sliding one overlaps its last screen (not with reduced
      // motion: the scenes then stand one after the other, a screen each). A pinned scene bleeds 1 px of its
      // background upwards: where two scenes meet on a fractional pixel, the previous one's edge never shows as a
      // line across the top (a sliding scene must not: its picture continues the one under it).
      className={`scene-height relative z-10 ${from === "slide" ? "motion-safe:-mt-[100svh]" : ""} ${className}`}
      style={
        {
          "--scene-h": `${heightVh}vh`,
          "--scene-h-phone": phoneHeight === undefined ? undefined : `${phoneHeight}vh`,
          background,
          boxShadow: from === "pin" ? `0 -1px 0 ${background}` : undefined,
        } as CSSProperties
      }
    >
      <div className="sticky top-0 h-svh overflow-hidden">{children}</div>
    </section>
  );
}
