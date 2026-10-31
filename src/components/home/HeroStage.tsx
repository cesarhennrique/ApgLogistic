"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ArrivalFrame } from "@/components/journey/ArrivalFrame";
import { segment } from "@/components/journey/segment";
import { readDebugParams } from "@/three/debug";
import { PHONE_DECK, PHOTO_MARKS, photoToScreen } from "./heroPhoto";

const HeroCanvas = dynamic(() => import("@/three/HeroCanvas"), { ssr: false });

// The exit, over the hero's scroll (0–1): the copy and the map rise away, the photo pushes in on the ship's deck
// (exponentially, so at an even pace) and darkens a little, and scene 1's picture (seen from above) comes over it.
// Every step of the scroll changes the push.
const COPY_OUT = [0, 0.25] as const;
const MAP_OUT = [0, 0.35] as const;
const OCEAN_IN = [0.7, 1] as const;
const PUSH = 1.35;
const DARKEN = 0.35;
// Pointer parallax (fine pointers only): the photo and the map, the nearer moving more.
const PARALLAX = { photo: 8, map: 14 };

// The hero's sticky stage: the photo (the LCP, server-rendered), its shades, the 3D map in the sky (its canvas only,
// loaded after the page), scene 1's picture for the hand-over, and the copy.
export function HeroStage({ photo, children }: { photo: ReactNode; children: ReactNode }) {
  const photoDrift = useRef<HTMLDivElement>(null);
  const photoPush = useRef<HTMLDivElement>(null);
  const darken = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const mapDrift = useRef<HTMLDivElement>(null);
  const mapExit = useRef<HTMLDivElement>(null);
  const ocean = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState(false);
  const reduced = useReducedMotion();

  // The 3D chunk (three, drei) loads after the page's load event and an idle moment, off the LCP's path.
  useEffect(() => {
    const go = () => setCanvas(true);
    const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 1000 }) : setTimeout(go, 100));
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
  }, []);

  // The push's origin: the deck where the cover fit puts it on this screen.
  useEffect(() => {
    const el = photoPush.current!;
    const place = () => {
      const { offsetWidth: W, offsetHeight: H } = el;
      const deck = W < 768 ? PHONE_DECK : PHOTO_MARKS.deck;
      const { x, y } = photoToScreen(W, H, deck.x, deck.y);
      el.style.transformOrigin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const apply = (d: number) => {
      const copyOut = segment(d, ...COPY_OUT);
      copy.current!.style.opacity = String(1 - copyOut);
      copy.current!.style.transform = `translate3d(0, ${(-copyOut * 10).toFixed(2)}vh, 0)`;
      copy.current!.style.visibility = copyOut >= 1 ? "hidden" : "";
      shade.current!.style.opacity = String(1 - 0.6 * copyOut);
      const mapOut = segment(d, ...MAP_OUT);
      mapExit.current!.style.opacity = String(1 - mapOut);
      mapExit.current!.style.transform = `translate3d(0, ${(-mapOut * 22).toFixed(2)}vh, 0)`;
      photoPush.current!.style.transform = `scale(${(PUSH ** d).toFixed(4)})`;
      darken.current!.style.opacity = String(d * DARKEN);
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
      {/* The photo: drift (pointer) › push (scroll) › its entrance (the intro's slow zoom out, data-intro-photo). The
          drift layer overhangs by the parallax's reach, so no edge shows. */}
      {/* Clipped 1 px short of the bottom (navy there, under the shade): Chrome never counts an image that covers the
          whole viewport as the LCP (it takes it for a background), and this photo is the page's main content. */}
      <div className="absolute inset-x-0 top-0 bottom-px overflow-hidden">
        <div ref={photoDrift} className="absolute -inset-2">
          <div ref={photoPush} className="absolute inset-0">
            <div data-intro-photo="" className="absolute inset-0">
              {photo}
            </div>
          </div>
        </div>
      </div>
      <div ref={darken} aria-hidden="true" className="absolute inset-0 bg-navy-900 opacity-0" />
      {/* Shades for the copy: navy from the left (92% at the edge, gone by 60%) and from the bottom under the band;
          on phones, from the bottom under the copy. */}
      <div ref={shade} aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-linear-to-r from-navy-900/92 via-navy-900/80 via-35% to-transparent to-60% max-md:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-t from-navy-900/90 to-transparent md:h-[28%]" />
        <div className="absolute inset-0 bg-linear-to-t from-navy-900/95 via-navy-900/85 via-50% to-transparent to-85% md:hidden" />
        {/* and a soft one from the top, for the header and the map over the bright sky */}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-linear-to-b from-navy-900/60 to-transparent md:h-[40%] md:from-navy-900/45" />
      </div>
      <div aria-hidden="true" className="absolute inset-0">
        {/* The map in the sky: drift (pointer) › exit (scroll). */}
        <div ref={mapDrift} className="absolute inset-0">
          <div ref={mapExit} className="absolute inset-0">
            {canvas && <HeroCanvas />}
          </div>
        </div>
        {/* Scene 1's picture, only needed at the end of the exit: mounted with the canvas, after the load, so its
            photo never competes with the LCP. */}
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
