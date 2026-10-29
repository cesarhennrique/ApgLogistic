"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { lenisRef } from "@/components/motion/SmoothScroll";
import { GRAIN } from "@/components/ui/grain";
import { site } from "@/content/site";
import { SEEN_KEY, introBridge, setCovered } from "./bridge";
import { playIntro } from "./IntroTimeline";
import { LOADER, loadTarget, stepCounter } from "./loaderProgress";

// The arrow of public/brand/arrow.svg, drawn as an outline.
const ARROW =
  "M4319.754 7.276c-.242.673-11.639 48.586-25.327 106.474L4269.54 219h-449.47c-261.22 0-449.072.371-448.52.886.523.488 60.75 35.12 133.839 76.961l132.889 76.075-12.889 6.084c-7.089 3.346-95.41 45.102-196.269 92.789L3245.741 558.5l54.879.609c30.184.334 242.673.672 472.197.75 396.933.134 417.293.226 416.812 1.891-4.793 16.566-58.609 212.587-58.409 212.748.491.396 828.781-396.778 828.762-397.401-.015-.504-627.017-364.301-636.523-369.321-2.428-1.283-3.378-1.411-3.705-.5";

// The <html> class set before first paint by the inline script in layout.tsx.
type Mode = "full" | "short" | "none";
function readMode(): Mode {
  const html = document.documentElement.classList;
  return html.contains("intro-full") ? "full" : html.contains("intro-short") ? "short" : "none";
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {}
  // A later client-side visit to Home in this session skips the loader too.
  document.documentElement.classList.replace("intro-full", "intro-short");
}

const statusAt = (value: number) => site.intro.status.find((s) => value <= s.until)!.text;

// The first-visit loader and the conductor of the hero's entrance. It is in the server HTML and shown by CSS only
// under html.intro-full, so it covers the page from the first paint while the h1 paints beneath it (LCP).
export function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const arrows = useRef<(SVGSVGElement | null)[]>([]);
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mode = readMode();
    if (mode === "none") return;
    if (mode === "short") {
      playIntro({ short: true });
      return;
    }

    lenisRef.current?.stop();
    setCovered(true);
    let fonts = false;
    document.fonts.ready.then(() => (fonts = true));
    // From navigation start on a first load; from now on a client-side visit.
    const start = performance.now() < LOADER.maxMs ? 0 : performance.now();
    let value = 0;
    let last = performance.now();
    let shown = "";
    let exit: gsap.core.Timeline | null = null;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - start;
      const target = loadTarget({ fonts, assets: introBridge.assets, frame: introBridge.frame }, elapsed);
      value = stepCounter(value, target, elapsed, now - last);
      last = now;
      // Three arrows, drawn one after the other, left to right.
      paths.current.forEach((path, i) => {
        path?.style.setProperty("stroke-dashoffset", String(1 - Math.min(Math.max((value / 100) * 3 - i, 0), 1)));
      });
      counter.current!.textContent = String(Math.floor(value)).padStart(3, "0");
      const text = statusAt(value);
      if (text !== shown) status.current!.textContent = shown = text;
      if (value >= 100) leave();
    };

    const leave = () => {
      gsap.ticker.remove(tick);
      // When the loading ended, from navigation start (read by the e2e).
      root.current!.dataset.leaving = String(Math.round(performance.now()));
      setCovered(false);
      // The arrows shoot off to the right while the curtain lifts; the map's routes take their stroke over.
      exit = gsap
        .timeline({
          onComplete: () => {
            root.current!.dataset.done = "";
            lenisRef.current?.start();
            markSeen();
          },
        })
        .to(arrows.current, { x: () => window.innerWidth, duration: 0.45, ease: "power2.in", stagger: { each: 0.04, from: "end" } })
        .to(root.current, { opacity: 0, duration: 0.45, ease: "power2.out" }, 0.15);
      playIntro({ short: false });
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      exit?.kill();
      setCovered(false);
      lenisRef.current?.start();
    };
  }, []);

  return (
    <div
      ref={root}
      aria-hidden="true"
      data-loader=""
      className="fixed inset-0 z-[80] hidden flex-col items-center justify-center bg-navy-900 text-sand-50"
    >
      <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.22))]" />
      <div className="relative flex w-[min(64vw,300px)] items-center">
        {[0, 1, 2].map((i) => (
          <svg
            key={i}
            ref={(el) => {
              arrows.current[i] = el;
            }}
            viewBox="3230 -10 1745 800"
            className="w-1/3 shrink-0 overflow-visible"
          >
            <path
              ref={(el) => {
                paths.current[i] = el;
              }}
              d={ARROW}
              pathLength={1}
              fill="none"
              stroke="#e31e24"
              strokeWidth={1.5}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1"
              strokeDashoffset="1"
            />
          </svg>
        ))}
      </div>
      <span ref={counter} className="font-mono-tabular relative mt-8 text-sm tracking-[0.2em]">
        000
      </span>
      <span ref={status} className="relative mt-2 font-mono text-xs tracking-wider text-steel-400">
        {site.intro.status[0].text}
      </span>
      <span className="site-container absolute inset-x-0 bottom-6 font-mono text-[11px] tracking-[0.18em] text-steel-400">
        {site.intro.coordinate}
      </span>
    </div>
  );
}
