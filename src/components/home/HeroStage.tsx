"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ArrivalFrame } from "@/components/journey/ArrivalFrame";
import { segment } from "@/components/journey/segment";
import { readDebugParams } from "@/three/debug";
import { heroDive } from "@/three/progress";

const HeroCanvas = dynamic(() => import("@/three/HeroCanvas"), { ssr: false });

// The exit, over the hero's scroll (heroDive, 0–1): the copy rises away; the camera dives into Suape on the map
// (CameraRig, heroCamera), its red dot swelling into a glow (HeroMapStage); the night photo fades; scene 1's picture
// opens out of the glow. Every step of the scroll moves the dive.
const COPY_OUT = [0, 0.25] as const;
const PHOTO_OUT = [0.15, 0.55] as const;
const OCEAN_IN = [0.78, 1] as const;
// Pointer parallax (fine pointers only): the photo and the map, the nearer moving more.
const PARALLAX = { photo: 6, map: 14 };

// The hero's sticky stage: the night photo of the port (the LCP, server-rendered) in the lower right, the 3D map (the
// hero's centrepiece; its canvas mounts after the load, a static outline stands in until then), scene 1's picture
// for the hand-over, and the copy.
export function HeroStage({ photo, children }: { photo: ReactNode; children: ReactNode }) {
  const photoDrift = useRef<HTMLDivElement>(null);
  const photoLayer = useRef<HTMLDivElement>(null);
  const mapDrift = useRef<HTMLDivElement>(null);
  const ocean = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const reduced = useReducedMotion();

  // The 3D chunk (three, drei: ~530 KB of script) loads after the page's load event, a frame actually painted (on a
  // fast connection the load can fire before the first paint) and an idle moment: off the LCP's path.
  useEffect(() => {
    const go = () => setCanvas(true);
    const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1000 }) : setTimeout(go, 100));
    const afterPaint = () => requestAnimationFrame(() => setTimeout(idle, 0));
    if (document.readyState === "complete") afterPaint();
    else window.addEventListener("load", afterPaint, { once: true });
  }, []);

  useEffect(() => {
    const apply = (d: number) => {
      heroDive.value = d;
      const copyOut = segment(d, ...COPY_OUT);
      copy.current!.style.opacity = String(1 - copyOut);
      copy.current!.style.transform = `translate3d(0, ${(-copyOut * 10).toFixed(2)}vh, 0)`;
      copy.current!.style.visibility = copyOut >= 1 ? "hidden" : "";
      photoLayer.current!.style.opacity = String(1 - segment(d, ...PHOTO_OUT));
      ocean.current!.style.opacity = String(segment(d, ...OCEAN_IN));
    };
    const { frozen } = readDebugParams(window.location.search);
    if (frozen !== null) return apply(frozen);
    if (reduced) return apply(0);
    const trigger = ScrollTrigger.create({
      trigger: document.getElementById("hero"),
      start: "top top",
      end: "bottom 200%",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });
    apply(trigger.progress);
    return () => trigger.kill();
  }, [reduced]);

  // The parallax: the pointer's offset from the screen's centre, eased.
  useEffect(() => {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const to = (el: HTMLElement) => ({ x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }), y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }) });
    const p = to(photoDrift.current!);
    const m = to(mapDrift.current!);
    const onMove = (event: PointerEvent) => {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      p.x(-nx * PARALLAX.photo);
      p.y(-ny * PARALLAX.photo);
      m.x(-nx * PARALLAX.map);
      m.y(-ny * PARALLAX.map);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  return (
    <div className="sticky top-0 isolate h-svh overflow-hidden bg-navy-900">
      {/* The photo, at night: the port's lights low on the right, under the map; its edges dissolve into the navy
          sky. Drift (pointer) › the photo, with its entrance zoom (data-intro-photo). */}
      <div
        ref={photoLayer}
        // (never the whole viewport: Chrome does not count such an image as the LCP)
        className="absolute inset-x-0 top-[28%] bottom-0 [mask-image:linear-gradient(to_bottom,transparent,black_30%)] md:top-[42%] md:left-[30%] md:[mask-composite:intersect] md:[mask-image:linear-gradient(to_bottom,transparent,black_30%),linear-gradient(to_right,transparent,black_25%)]"
      >
        <div ref={photoDrift} className="absolute -inset-2">
          <div data-intro-photo="" className="absolute inset-0">
            {photo}
          </div>
        </div>
        {/* Night: a light blue duotone, then navy over all of it but the lights of the quay (lower right). */}
        <div aria-hidden="true" className="absolute inset-0 bg-[#2a55c0] opacity-35 mix-blend-color" />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_55%_60%_at_85%_80%,rgb(10_19_56/0.5),rgb(10_19_56/0.9)_70%)]"
        />
      </div>
      {/* Phones: the copy sits low, over the photo; a deeper navy under it. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[60%] bg-linear-to-t from-navy-900 via-navy-900/85 to-transparent md:hidden" />

      <div aria-hidden="true" className="absolute inset-0">
        {/* The map: drift (pointer); a static outline until the canvas is ready (it fades in over it). */}
        <div ref={mapDrift} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in outline, never the LCP */}
          <img
            src="/images/map/nordeste.svg"
            alt=""
            className={`absolute top-[16%] right-[6%] h-[60%] w-auto invert transition-opacity duration-600 ease-out max-md:top-[12%] max-md:right-[8%] max-md:h-[34%] ${mapReady ? "opacity-0" : "opacity-[0.07]"}`}
          />
          {canvas && <HeroCanvas onReady={() => setMapReady(true)} />}
        </div>
        <div ref={ocean} className="absolute inset-0 overflow-hidden opacity-0">
          {canvas && <ArrivalFrame alt="" />}
        </div>
      </div>
      <div ref={copy} className="relative flex h-full flex-col">
        {children}
      </div>
    </div>
  );
}
