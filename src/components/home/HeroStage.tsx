"use client";

import dynamic from "next/dynamic";
import { type ReactNode, startTransition, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { segment } from "@/components/journey/segment";
import { HERO_FRAME, StaticMap } from "@/components/journey/StaticMap";
import { JOURNEY_MOUNTED, usePhoneLayout } from "@/lib/phoneLayout";
import { useQualityTier } from "@/lib/quality";
import { readDebugParams } from "@/three/debug";
import { heroDive } from "@/three/progress";

const HeroCanvas = dynamic(() => import("@/three/HeroCanvas"), { ssr: false });
// (desktop's journey only: a phone never loads it)
const ArrivalFrame = dynamic(() => import("@/components/journey/ArrivalFrame").then((m) => m.ArrivalFrame), { ssr: false });

// The exit, over the hero's scroll (heroDive, 0–1): the copy rises away; the camera dives into Suape on the map
// (CameraRig, heroCamera), its red dot swelling into a glow (HeroMapStage); the night photo fades; scene 1's picture
// opens out of the glow. Every step of the scroll moves the dive.
const COPY_OUT = [0, 0.25] as const;
const PHOTO_OUT = [0.15, 0.55] as const;
const OCEAN_IN = [0.78, 1] as const;
// The hero's copy of scene 1's picture exists only for the hand-over (from a little before it shows): one copy of it
// the rest of the time, scene 1's (a phone's memory).
const OCEAN_MOUNT = 0.7;
// The SVG map's dive (the tiers without WebGL): it swells about Suape and fades, Suape's glow swelling out of it as
// on the 3D map (HeroMapStage: the same stretches, the same 40 px disc, never past 4096 device px across).
const SVG_DIVE = 3;
const SVG_FADE = [0.4, 0.85] as const;
const GLOW_IN = [0.55, 0.9] as const;
const GLOW_SCALE = 90;
const smooth = (t: number) => t * t * (3 - 2 * t);
// (phones: above the copy, which starts a third of the way down)
const MAP_BOX = "absolute top-[16%] right-[6%] h-[60%] max-md:top-[9%] max-md:right-[8%] max-md:h-[22%]";
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
  // In the hand-over (the dive past OCEAN_MOUNT); covered (scene 1 pinned over the hero): the map's canvas and the
  // hero's copy of scene 1 let go (one WebGL context at most on the page; the canvas comes back on the way up).
  const [handOver, setHandOver] = useState(false);
  const [covered, setCovered] = useState(false);
  // The 3D map back a screen before the hero on the way up (scene 1 more than two screens past its top: far), the SVG
  // map under it until its first frame; `back`: it has been away once (on the first visit, a faint outline instead).
  const [mapFar, setMapFar] = useState(false);
  const [back, setBack] = useState(false);
  const svgMap = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const handing = useRef(false);
  const reduced = useReducedMotion();
  // WebGL on the 'high' tier only (lib/quality); the others draw the map as SVG: still on 'static', animated on
  // 'low' (phones: no context to make again, nor shaders to compile, on the way back up)
  const tier = useQualityTier();
  // The phone's layout (lib/phoneLayout): no dive, no hand-over to scene 1, the SVG map animated whatever the tier
  const phone = usePhoneLayout();
  const webgl = tier === "high" && phone === false;
  const animated = tier === "low" || (tier === "high" && phone === true);

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
      if (svgMap.current) {
        const zoom = 1 + SVG_DIVE * d * d;
        svgMap.current.style.transform = `scale(${zoom.toFixed(3)})`;
        svgMap.current.style.opacity = String(1 - segment(d, ...SVG_FADE));
        const swell = smooth(segment(d, ...GLOW_IN));
        const scale = Math.min(1 + GLOW_SCALE * swell * swell, 4096 / (40 * devicePixelRatio));
        glow.current!.style.opacity = String(swell);
        glow.current!.style.transform = `translate(-50%, -50%) scale(${(scale / zoom).toFixed(2)})`;
      }
      // (React state only as the threshold is crossed, never per frame)
      if (d >= OCEAN_MOUNT !== handing.current) {
        const on = (handing.current = d >= OCEAN_MOUNT);
        // (a transition: React works in slices, never inside the scroll's own frame)
        startTransition(() => setHandOver(on));
      }
    };
    const { frozen } = readDebugParams(window.location.search);
    if (frozen !== null) return apply(frozen);
    if (reduced || phone !== false) return apply(0);
    const trigger = ScrollTrigger.create({
      trigger: document.getElementById("hero"),
      start: "top top",
      end: "bottom 200%",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });
    apply(trigger.progress);
    return () => trigger.kill();
  }, [reduced, tier, phone]);

  useEffect(() => {
    if (phone === null) return;
    // The phone's: the SVG map let go off screen, back as the hero comes in again.
    if (phone) {
      const io = new IntersectionObserver(([e]) => startTransition(() => setMapFar(!e.isIntersecting)));
      io.observe(document.getElementById("hero")!);
      return () => io.disconnect();
    }
    // Desktop: covered once scene 1 pins over the hero, far two screens past. (Scene 1 mounts after the hero: its
    // chunk loads once the layout is known, JourneyScenes.)
    let kill: (() => void) | null = null;
    const watch = () => {
      const scene = document.getElementById("chegada");
      if (!scene || kill) return;
      const trigger = ScrollTrigger.create({
        trigger: scene,
        start: "top top",
        // (also at creation, when the page opens past it)
        onEnter: () => startTransition(() => setCovered(true)),
        onLeaveBack: () => startTransition(() => setCovered(false)),
      });
      const far = ScrollTrigger.create({
        trigger: scene,
        start: "top -200%",
        onEnter: () =>
          startTransition(() => {
            setMapFar(true);
            setBack(true);
            setMapReady(false);
          }),
        onLeaveBack: () => startTransition(() => setMapFar(false)),
      });
      kill = () => {
        trigger.kill();
        far.kill();
      };
    };
    watch();
    window.addEventListener(JOURNEY_MOUNTED, watch);
    return () => {
      window.removeEventListener(JOURNEY_MOUNTED, watch);
      kill?.();
    };
  }, [phone]);

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
            className={`absolute top-[16%] right-[6%] h-[60%] w-auto invert transition-opacity duration-600 ease-out max-md:top-[12%] max-md:right-[8%] max-md:h-[34%] ${mapReady || back || !webgl ? "opacity-0" : "opacity-[0.07]"}`}
          />
          {/* The SVG map: the tiers without WebGL (animated on 'low'), or under the 3D one on its way back, until its
              first frame. It dives into Suape (scaled about it), Suape's glow swelling out of it. */}
          {/* (not while far: its SMIL and CSS animations would run, and invalidate, off screen) */}
          {tier !== null && !mapFar && (!webgl || (back && !mapReady)) && (
            <div
              ref={svgMap}
              className={MAP_BOX}
              style={{ aspectRatio: HERO_FRAME.aspect, transformOrigin: `${HERO_FRAME.suape.x * 100}% ${HERO_FRAME.suape.y * 100}%` }}
            >
              <StaticMap variant="hero" fit animated={animated} className="h-full w-full" />
              <div
                ref={glow}
                className="pointer-events-none absolute size-10 rounded-full bg-[radial-gradient(closest-side,rgb(255_214_200/0.95),rgb(227_30_36/0.75)_45%,transparent)] opacity-0"
                style={{ left: `${HERO_FRAME.suape.x * 100}%`, top: `${HERO_FRAME.suape.y * 100}%` }}
              />
            </div>
          )}
          {canvas && webgl && !mapFar && <HeroCanvas onReady={() => setMapReady(true)} />}
        </div>
        {/* Covered (scene 1 pinned over it): hidden and out of the drawing, let go only once far (unmounting it as
            scene 1 pins was a long task in the scroll's frame). */}
        <div ref={ocean} className={`absolute inset-0 overflow-hidden opacity-0 ${covered ? "invisible" : ""}`}>
          {canvas && handOver && !mapFar && <ArrivalFrame alt="" paused={covered} />}
        </div>
      </div>
      <div ref={copy} className="relative flex h-full flex-col">
        {children}
      </div>
    </div>
  );
}
