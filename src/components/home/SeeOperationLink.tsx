"use client";

import type { MouseEvent } from "react";
import { lenisRef } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import { STAGE_SPANS } from "@/three/stages/timeline";

// Scrolls to the start of chapter 1 (the crane stage). Without JS, the anchor still lands on the track.
export function SeeOperationLink() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const track = document.getElementById("journey-track");
    if (!track) return;
    event.preventDefault();
    // The track maps its scroll range (its height minus one viewport) to progress 0–1.
    const top = track.getBoundingClientRect().top + window.scrollY;
    const target = top + STAGE_SPANS.crane[0] * (track.offsetHeight - window.innerHeight);
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.6 });
    else window.scrollTo({ top: target });
  };

  return (
    <a
      href="#journey-track"
      onClick={onClick}
      className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring) md:text-base"
    >
      {site.home.hero.seeOperation}
      <span
        aria-hidden="true"
        className="transition-transform duration-150 ease-out group-hover:translate-y-0.5 motion-reduce:transition-none"
      >
        ↓
      </span>
    </a>
  );
}
