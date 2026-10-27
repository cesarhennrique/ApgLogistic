"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

// Same curves as --ease-drawer / --ease-in-out in globals.css (WAAPI can't read Tailwind tokens).
const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
// Animates `translate`, not `transform`: Tailwind v4 translate-* classes set the translate property and the two would stack.

let play: ((href: string) => void) | null = null;

/** Plays the curtain and navigates. Returns false when no curtain is mounted. */
export function playCurtain(href: string): boolean {
  if (!play) return false;
  play(href);
  return true;
}

export function PageCurtain() {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);

  useEffect(() => {
    play = (href) => {
      const curtain = curtainRef.current;
      const arrow = arrowRef.current;
      if (busy.current || !curtain || !arrow) return;
      busy.current = true;
      curtain.animate([{ translate: "0 100%" }, { translate: "0 0" }], {
        duration: 400,
        easing: EASE_DRAWER,
        fill: "forwards",
      }).finished.then(() => router.push(href));
      arrow.animate(
        [{ translate: "-100% -50%" }, { translate: "100vw -50%" }],
        { duration: 900, easing: EASE_IN_OUT },
      );
    };
    return () => {
      play = null;
    };
  }, [router]);

  // The new route has mounted: lift the curtain away.
  useEffect(() => {
    const curtain = curtainRef.current;
    if (!busy.current || !curtain) return;
    const exit = curtain.animate([{ translate: "0 0" }, { translate: "0 -100%" }], {
      duration: 450,
      easing: EASE_DRAWER,
      fill: "forwards",
    });
    exit.finished.then(() => {
      curtain.getAnimations().forEach((a) => a.cancel());
      busy.current = false;
    });
  }, [pathname]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <div ref={curtainRef} className="absolute inset-0 translate-y-full bg-navy-900" />
      <span
        ref={arrowRef}
        className="mask-arrow absolute top-1/2 left-0 aspect-[1714/769] w-[40vw] max-w-[28rem] -translate-x-full -translate-y-1/2 bg-red-500"
      />
    </div>
  );
}
