"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Counter } from "@/components/motion/Counter";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { ArrivalPhoto, ORIGINAL, cameraTransform, viewOf } from "./ArrivalPhoto";
import { BOW, sampleOceanCamera } from "./oceanCamera";
import { Scene, segment } from "./Scene";

const scene = site.journey.find((s) => s.id === "chegada")!;
const HEIGHT_VH = 280;

// The scene's first 100vh slide it in over the hero, the photo held still on screen (the hero's last picture); the
// camera's progress (q, 0–1) runs over the rest.
const SLIDE_END = 100 / HEIGHT_VH;
// The heading fades in once the slide is over (the hero's picture has none) and its label leaves before the close.
const LINE_IN = [0.02, 0.08] as const;
const LABEL_OUT = [0.5, 0.62] as const;
// The copy comes in when the ship fills the screen and leaves before the close.
const COPY_IN = [0.35, 0.42] as const;
const COPY_OUT = [0.68, 0.75] as const;
// The original photo (desktop) crossfades over the 1920 one, at the same place, before the zoom gets close.
const SHARP_IN = [0.12, 0.26] as const;
// Reduced motion: the camera stays where the copy comes in, the ship filling the screen.
const REDUCED_Q = COPY_IN[0];
// The heading starts this far ahead of the bow (photo px).
const BOW_GAP = 20;

// The counter starts when the copy comes in: a scroll position inside the scene (the number never scrolls itself,
// it sits on the sticky stage).
const counterStart = () => {
  const el = document.getElementById("chegada")!;
  const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight;
  return top + (SLIDE_END + COPY_IN[0] * (1 - SLIDE_END)) * el.offsetHeight;
};

// Scene 1 (spec §3): one still photo of the ship at sea; only the camera moves, coming down from the whole photo
// to the middle of the deck. A red dashed heading runs from the bow to "SUAPE · PE".
export function OceanArrival() {
  const stage = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const sharp = useRef<HTMLImageElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const state = useRef({ raw: 0, sharpLoaded: false });
  const [loadSharp, setLoadSharp] = useState(false);

  const apply = useCallback(() => {
    const { raw, sharpLoaded } = state.current;
    const el = stage.current!;
    // Sliding in over the hero: hold the photo still on screen, so it is the hero's last picture, seamlessly.
    const stageTop = reduced ? 0 : Math.max(el.parentElement!.getBoundingClientRect().top, 0);
    el.style.transform = `translate3d(0, ${(-stageTop).toFixed(1)}px, 0)`;

    const q = reduced ? REDUCED_Q : segment(raw, SLIDE_END, 1);
    const view = viewOf(el);
    const cam = sampleOceanCamera(q, view);
    photo.current!.style.transform = cameraTransform(cam);
    if (sharp.current) sharp.current.style.opacity = sharpLoaded ? String(reduced ? 1 : segment(q, ...SHARP_IN)) : "0";

    // The heading in screen space (a CSS-scaled SVG would scale its stroke too): its bottom just ahead of the bow.
    const bowX = cam.x + cam.scale * BOW.x;
    const bowY = cam.y + cam.scale * (BOW.y - BOW_GAP);
    const box = line.current!.parentElement!;
    line.current!.style.transform = `translate3d(${(bowX - 1).toFixed(1)}px, ${(bowY - box.offsetTop - line.current!.offsetHeight).toFixed(1)}px, 0)`;
    const lineIn = reduced ? 1 : segment(q, ...LINE_IN);
    line.current!.style.opacity = String(lineIn);
    heading.current!.style.opacity = String(lineIn * (1 - segment(q, ...LABEL_OUT)));

    const copyIn = reduced ? 1 : segment(q, ...COPY_IN) * (1 - segment(q, ...COPY_OUT));
    copy.current!.style.opacity = String(copyIn);
    scrim.current!.style.opacity = String(copyIn);
    copy.current!.style.transform = `translate3d(0, ${((1 - copyIn) * 16).toFixed(1)}px, 0)`;
    copy.current!.style.visibility = copyIn <= 0 ? "hidden" : "";
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      state.current.raw = p;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [apply]);

  // The original (6688 px) only for the desktop close, fetched as the scene comes near (the phone's close is the
  // 1920 one).
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setLoadSharp(true);
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(document.getElementById("chegada")!);
    return () => io.disconnect();
  }, []);

  const onSharpLoad = () => {
    state.current.sharpLoaded = true;
    apply();
  };

  return (
    <Scene
      id="chegada"
      heightVh={HEIGHT_VH}
      background="#0d2f4f"
      headerTheme="dark"
      from="slide"
      onProgress={onProgress}
      // Over the hero's last screen: it slides in on top of the hero's picture.
      className="z-10 -mt-[100svh]"
    >
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <ArrivalPhoto photo={photo} alt={site.journeyScene.shipAlt}>
          {loadSharp && (
            <picture>
              <source type="image/avif" srcSet={ORIGINAL.avif} />
              <img
                ref={sharp}
                src={ORIGINAL.webp}
                alt=""
                decoding="async"
                onLoad={onSharpLoad}
                className="absolute inset-0 h-full w-full opacity-0"
              />
            </picture>
          )}
        </ArrivalPhoto>
      </div>

      {/* Enough navy at the left for the copy to read over the deck. */}
      <div
        ref={scrim}
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[55%] bg-linear-to-r from-navy-900/55 to-transparent opacity-0 max-md:hidden"
      />

      {/* The heading: a red dashed line from "SUAPE · PE" down to the bow. The label sits in the header's free middle:
          the photo leaves little sea above the bow. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[52px] bottom-0 overflow-hidden">
        <div
          ref={line}
          className="absolute top-0 left-0 h-[200vh] w-[2px] opacity-0"
          style={{ backgroundImage: "repeating-linear-gradient(to top, #e31e24 0 6px, transparent 6px 11px)" }}
        />
      </div>
      <div
        ref={heading}
        aria-hidden="true"
        className="absolute top-[34px] left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-sand-50 opacity-0"
      >
        {site.journeyScene.mapLabels.suape}
      </div>

      <div
        ref={copy}
        className="site-container absolute inset-x-0 bottom-[8svh] text-sand-50 opacity-0 md:top-[34svh] md:bottom-auto"
      >
        <div className="max-w-[24rem] max-md:rounded-sm max-md:bg-navy-900/55 max-md:p-4 max-md:backdrop-blur-sm">
          <ContainerCode index={homeCode("chegada")} label={scene.code} />
          <p className="font-condensed mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold uppercase">
            <Counter value={site.journeyScene.arrivalTeus} start={counterStart} className="tabular-nums" />
            <span className="block">{scene.text}</span>
          </p>
        </div>
      </div>
    </Scene>
  );
}
