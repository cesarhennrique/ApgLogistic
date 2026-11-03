"use client";

import { useEffect, useRef } from "react";
import { lenisRef } from "@/components/motion/SmoothScroll";
import { site } from "@/content/site";

// The journey's side index (wide screens): a mark per scene, the hero's and the five's, the one in view red; each
// takes you to its scene. Shown only over the journey. The active mark is written to the DOM on scroll.
const MARKS = [
  { id: "hero", label: site.home.hero.code },
  ...site.journey.map((s) => ({ id: s.id, label: s.code })),
];

export function JourneyIndex() {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = nav.current!;
    const journey = document.getElementById("journey")!;
    const buttons = [...el.querySelectorAll<HTMLButtonElement>("button")];
    const sections = MARKS.map((m) => document.getElementById(m.id));
    let frame = 0;
    const update = () => {
      frame = 0;
      // the scene under the screen's middle; where two overlap (a slide), the later one
      const mid = window.innerHeight / 2;
      let active = 0;
      sections.forEach((s, i) => {
        const r = s?.getBoundingClientRect();
        if (r && r.top <= mid && r.bottom >= mid) active = i;
      });
      buttons.forEach((b, i) => (i === active ? b.setAttribute("aria-current", "step") : b.removeAttribute("aria-current")));
    };
    const onScroll = () => (frame ||= requestAnimationFrame(update));
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-on", e.isIntersecting));
    io.observe(journey);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const go = (id: string) => {
    const target = document.getElementById(id)!;
    if (lenisRef.current) lenisRef.current.scrollTo(target, { duration: 1.4 });
    else target.scrollIntoView();
  };

  return (
    <nav
      ref={nav}
      aria-label={site.ui.journeyNav}
      className="pointer-events-none fixed top-1/2 right-3 z-40 -translate-y-1/2 opacity-0 transition-opacity duration-200 ease-out data-on:pointer-events-auto data-on:opacity-100 max-md:hidden"
    >
      <ol className="flex flex-col items-end gap-1">
        {MARKS.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => go(m.id)}
              aria-label={`${site.ui.goTo} ${m.label}`}
              className="group grid h-6 w-10 place-items-center justify-items-end focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <span className="h-0.5 w-4 origin-right bg-steel-400 shadow-[0_0_0_1px_rgb(10_19_56/0.25)] transition-transform duration-200 ease-out group-hover:bg-sand-50 group-aria-[current=step]:scale-x-[1.75] group-aria-[current=step]:bg-red-500" />
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
