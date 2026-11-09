"use client";

import type { MouseEvent } from "react";
import { lenisRef } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";
import { isPhoneLayout } from "@/lib/phoneLayout";

// Scrolls to where scene 1 begins: the hero's dive done, the ocean full screen, scene 1 about to slide in. Without
// JS, the anchor still lands on scene 1.
export function SeeOperationLink() {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const scene = document.getElementById("chegada");
    if (!scene) return;
    event.preventDefault();
    // (the phone's journey, lib/phoneLayout: no hand-over, scene 1 itself)
    const target = scene.getBoundingClientRect().top + window.scrollY - (isPhoneLayout() ? 0 : window.innerHeight);
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.6 });
    else window.scrollTo({ top: target });
  };

  return (
    <a
      href="#chegada"
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
