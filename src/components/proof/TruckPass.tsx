"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";

// Source image: 1672x941, photoreal truck on #FEFEFE. Wheel hubs measured on the source.
const IMG = { src: "/images/journey/carreta-lado.webp", w: 1672, h: 941 };
const WHEELS = [172, 578, 1216, 1357, 1498].map((x) => ({ x, y: 639 }));
// Rotating disc radius in source px: the cut falls on the plain sidewall (rim lip ends ~40, tyre ~61),
// so the seam is invisible; cutting on the rim lip showed a broken ring.
const RIM_R = 54;
const ROAD_Y = 700; // tyre contact line in source px

export function TruckPass() {
  const section = useRef<HTMLElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const lanes = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !section.current) return;
    const rims = truck.current!.querySelectorAll<HTMLElement>("[data-rim]");
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: ({ progress: p }) => {
          // Drive in (0–0.35), park while the copy reads (0.35–0.65), drive out (0.65–1).
          const inOut = p < 0.35 ? gsap.parseEase("power2.out")(p / 0.35) - 1 : p > 0.65 ? gsap.parseEase("power2.in")((p - 0.65) / 0.35) : 0;
          const vw = window.innerWidth;
          const truckW = truck.current!.offsetWidth;
          // The cab faces left, so forward is right-to-left: enter from the right, leave to the left.
          const x = -inOut * (vw / 2 + truckW / 2 + 40);
          truck.current!.style.transform = `translate3d(${x}px,0,0)`;
          // Wheels and lanes keep rolling even while parked: the truck is "cruising".
          const travel = p * vw * 3;
          const tyreR = ((ROAD_Y - WHEELS[0].y) / IMG.w) * truckW;
          const deg = -(travel / tyreR) * (180 / Math.PI);
          rims.forEach((r) => (r.style.transform = `rotate(${deg}deg)`));
          lanes.current!.style.backgroundPositionX = `${travel}px`;
          trail.current!.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (vw / 2 - x) / vw)})`;
          const showCopy = gsap.utils.clamp(0, 1, (p - 0.3) / 0.08) * gsap.utils.clamp(0, 1, (0.72 - p) / 0.08);
          copy.current!.style.opacity = String(showCopy);
          copy.current!.style.transform = `translate3d(0,${(1 - showCopy) * 16}px,0)`;
          speed.current!.textContent = String(Math.round(80 - Math.abs(inOut) * 30)).padStart(3, "0");
        },
      });
    }, section);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={section} className="relative h-[300vh] bg-[#FEFEFE] text-navy-900">
      <div className="sticky top-0 flex h-svh flex-col justify-end overflow-hidden pb-[8vh]">
        <div ref={copy} className="site-container absolute inset-x-0 top-[12vh] z-10" style={{ opacity: reduced ? 1 : 0 }}>
          <p className="font-mono-tabular text-xs tracking-[0.2em] text-navy-900/60">APGU 1996-04 · FROTA</p>
          <h2 className="font-condensed mt-4 max-w-[16ch] text-4xl font-bold uppercase leading-[0.92] md:text-6xl">
            Frota 100% própria e rastreada
          </h2>
          <p className="font-mono-tabular mt-6 text-sm text-navy-900/70">
            BR-101 · <span ref={speed}>080</span> KM/H · 24H
          </p>
        </div>

        <div className="relative w-full">
          {/* road first so the truck paints over it; the image multiplies, so its white box vanishes */}
          <div
            className="absolute inset-x-0 h-px bg-navy-900/15"
            style={{ top: `${(ROAD_Y / IMG.h) * 100}%` }}
            aria-hidden
          />
          <div
            ref={lanes}
            aria-hidden
            className="absolute inset-x-0 h-[3px]"
            style={{
              top: `calc(${(ROAD_Y / IMG.h) * 100}% + 28px)`,
              backgroundImage: "linear-gradient(90deg, rgb(10 19 56 / 0.18) 0 48px, transparent 48px 96px)",
              backgroundSize: "96px 3px",
            }}
          />
          <div
            ref={trail}
            aria-hidden
            className="absolute left-0 h-[3px] w-full origin-right bg-red-500"
            style={{ top: `calc(${(ROAD_Y / IMG.h) * 100}% + 1px)`, transform: "scaleX(0)" }}
          />
          <div
            ref={truck}
            className="relative mx-auto w-[min(1280px,92vw,115vh)] will-change-transform"
            style={{ aspectRatio: `${IMG.w} / ${IMG.h}` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- exact-pixel overlay math needs the raw image box */}
            <img src={IMG.src} alt="Carreta APG com container de 40 pés" className="absolute inset-0 h-full w-full mix-blend-multiply" />
            {WHEELS.map((w) => (
              <div
                key={w.x}
                data-rim
                aria-hidden
                className="absolute rounded-full"
                style={{
                  left: `${((w.x - RIM_R) / IMG.w) * 100}%`,
                  top: `${((w.y - RIM_R) / IMG.h) * 100}%`,
                  width: `${((2 * RIM_R) / IMG.w) * 100}%`,
                  aspectRatio: "1",
                  backgroundImage: `url(${IMG.src})`,
                  backgroundSize: `${(IMG.w / (2 * RIM_R)) * 100}% auto`,
                  backgroundPosition: `${((w.x - RIM_R) / (IMG.w - 2 * RIM_R)) * 100}% ${((w.y - RIM_R) / (IMG.h - 2 * RIM_R)) * 100}%`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
