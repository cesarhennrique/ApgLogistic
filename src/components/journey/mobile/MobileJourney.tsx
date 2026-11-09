"use client";

import { type CSSProperties, type ReactNode, type RefObject, useEffect, useRef } from "react";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { Scoreboard } from "@/components/ui/Scoreboard";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { JOURNEY_MOUNTED } from "@/lib/phoneLayout";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ROAD_ICONS } from "../roadIcons";
import { HERO_FRAME, StaticMap } from "../StaticMap";
import { pickLoaded } from "../videoSlots";

// The phone's journey (spec §3, M3): native scroll, nothing pinned or scrubbed. Each scene a short clip of the
// desktop's (scripts/record-mobile-clips.mjs: 720 × 1558, H.264, decoded by the phone's hardware) that plays once as
// it comes into view; every text in HTML over or under it, in once (globals.css: .m-in); the distribution the
// SVG map, its routes drawn in once.
const DIR = "/video/jornada";
const CLIP = { width: 720, height: 1558 };
const scene = (id: string) => site.journey.find((s) => s.id === id)!;
const { journeyScene: copy } = site;
const count = new Intl.NumberFormat("pt-BR");
const dm = ([d, m]: readonly number[]) => `${String(d).padStart(2, "0")}°${String(m).padStart(2, "0")}′`;
// a step of a stagger, for .m-in
const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

// One clip: its poster (the first frame; the last once played) until it plays; its last frame as a still where it
// can't (reduced motion, or iOS' Low Power Mode refusing play()). Its source set only while near (useClips).
function Clip({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div data-clip-box="" className="group/clip relative">
      <video
        data-clip=""
        data-src={`${DIR}/${name}.mp4`}
        data-end={`${DIR}/${name}-fim.webp`}
        poster={`${DIR}/${name}-poster.webp`}
        muted
        playsInline
        preload="none"
        width={CLIP.width}
        height={CLIP.height}
        aria-hidden="true"
        className="block h-auto w-full group-data-still/clip:invisible"
      />
      <picture className="absolute inset-0 hidden group-data-still/clip:block">
        <source type="image/avif" srcSet={`${DIR}/${name}-fim.avif`} />
        <img src={`${DIR}/${name}-fim.webp`} alt="" width={CLIP.width} height={CLIP.height} loading="lazy" className="h-full w-full" />
      </picture>
      {children}
    </div>
  );
}

// The clips' playback: a source on the two nearest within a screen (pickLoaded), the rest let go; each plays once
// it is 60% in view, from the start when it comes in from above, and pauses out of view; played, its poster is its
// last frame. Every section's copy in once, as it comes into view.
function useClips(root: RefObject<HTMLElement | null>, reduced: boolean) {
  useEffect(() => {
    const el = root.current!;
    const videos = [...el.querySelectorAll<HTMLVideoElement>("video[data-clip]")];
    const box = (v: HTMLVideoElement) => v.parentElement!;
    const unload = (v: HTMLVideoElement) => {
      if (!v.getAttribute("src")) return;
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
    const still = (v: HTMLVideoElement) => {
      unload(v);
      box(v).setAttribute("data-still", "");
      box(v).setAttribute("data-ended", "");
    };

    const sections = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-in", "");
          sections.unobserve(e.target);
        }
      },
      { threshold: 0.2 },
    );
    for (const s of el.querySelectorAll("[data-m-section]")) sections.observe(s);
    if (reduced) {
      videos.forEach(still);
      return () => sections.disconnect();
    }

    const slots = () => {
      const keep = new Set(pickLoaded(videos.map((v) => v.getBoundingClientRect()), window.innerHeight).map((i) => videos[i]));
      for (const v of videos) {
        if (!keep.has(v)) unload(v);
        else if (!v.getAttribute("src") && !box(v).hasAttribute("data-still")) {
          v.preload = "auto";
          v.src = v.dataset.src!;
        }
      }
    };
    const play = (v: HTMLVideoElement, restart: boolean) => {
      if (box(v).hasAttribute("data-still")) return;
      if (!v.getAttribute("src")) slots();
      if (restart) {
        v.currentTime = 0;
        box(v).removeAttribute("data-ended");
      } else if (box(v).hasAttribute("data-ended")) return;
      // refused (Low Power Mode, no codec): the still instead; an abort (paused or let go meanwhile) is no failure
      v.play().catch((error: DOMException) => {
        if (error.name !== "AbortError") still(v);
      });
    };
    const onEnded = (event: Event) => {
      const v = event.target as HTMLVideoElement;
      box(v).setAttribute("data-ended", "");
      v.poster = v.dataset.end!;
    };
    // (from the page's load on: scene 1's clip, a screen below the hero, never competes with the hero's LCP)
    let loaded = document.readyState === "complete";
    const near = new IntersectionObserver(() => loaded && slots(), { rootMargin: "100% 0px" });
    const onLoad = () => {
      loaded = true;
      slots();
    };
    if (!loaded) window.addEventListener("load", onLoad, { once: true });
    const view = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          // (in from above: its top still below the viewport's)
          if (e.intersectionRatio >= 0.6) play(v, e.boundingClientRect.top > 0 && box(v).hasAttribute("data-ended"));
          else if (!e.isIntersecting) v.pause();
        }
      },
      { threshold: [0, 0.6] },
    );
    for (const v of videos) {
      near.observe(v);
      view.observe(v);
      v.addEventListener("ended", onEnded);
    }
    return () => {
      window.removeEventListener("load", onLoad);
      sections.disconnect();
      near.disconnect();
      view.disconnect();
      for (const v of videos) {
        v.removeEventListener("ended", onEnded);
        unload(v);
      }
    };
  }, [root, reduced]);
}

export default function MobileJourney() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useClips(root, reduced);
  useEffect(() => void window.dispatchEvent(new Event(JOURNEY_MOUNTED)), []);
  const { hud, notes, targetCard, crane, road, track, history, distribution } = copy;

  return (
    <div ref={root}>
      {/* 1: the ship's arrival, the camera down to the client's container. */}
      <section id="chegada" data-m-section="" data-header-theme="dark" className="relative bg-[#0d2f4f] text-sand-50">
        <Clip name="navio">
          <div className="m-in absolute top-20 right-4 bg-navy-900/70 px-3 py-2 text-right font-mono text-xs leading-relaxed tracking-[0.12em] uppercase">
            <span className="block tabular-nums">
              {dm(hud.to.lat)}S {dm(hud.to.lon)}W
            </span>
            <span className="block">{hud.destination}</span>
            <span className="block">
              <span aria-hidden="true" className="mr-2 inline-block h-0.5 w-3 bg-red-500 align-middle" />
              {hud.mode}
            </span>
          </div>
          {/* the client's container, once the camera is on it */}
          <p data-note="" className="absolute top-[34%] left-4 bg-navy-900 px-3 py-2 font-mono text-[13px] leading-snug tracking-[0.1em] opacity-0 transition-opacity duration-500 ease-out group-data-ended/clip:opacity-100">
            <span className="block">{notes.target}</span>
            <span className="mt-1 block">
              <ContainerCode index={targetCard.index} label={targetCard.label} tone="opacity-100" />
            </span>
          </p>
          <div className="site-container absolute inset-x-0 bottom-[6%]">
            <div className="m-in max-w-[24rem] rounded-sm bg-navy-900/80 p-4" style={delay(150)}>
              <ContainerCode index={homeCode("chegada")} label={scene("chegada").code} />
              <p className="font-condensed mt-4 text-[2.5rem] leading-[0.92] font-bold uppercase">
                <span className="tabular-nums">{count.format(copy.arrivalTeus)}</span>
                <span className="block">{scene("chegada").text}</span>
              </p>
              <p className="mt-3 font-mono text-xs tracking-[0.12em] uppercase">
                {notes.heading} · {notes.containers}
              </p>
            </div>
          </div>
        </Clip>
      </section>

      {/* 2: the crane lowering the container to the truck. */}
      <section id="porteiner" data-m-section="" data-header-theme="light" className="relative bg-[#fefefe] text-navy-900">
        <Clip name="porteiner">
          <div className="site-container absolute inset-x-0 top-20">
            <div className="m-in max-w-[30rem] rounded-sm bg-[#fefefe]/85 p-3">
              <ContainerCode index={homeCode("porteiner")} label={scene("porteiner").code} />
              <p className="font-condensed mt-3 max-w-[16ch] text-[1.6rem] leading-[0.92] font-bold uppercase">{scene("porteiner").text}</p>
              <dl className="mt-4 flex gap-8">
                {crane.stats.map((s) => (
                  <div key={s.unit}>
                    <dt className="sr-only">{s.unit}</dt>
                    <dd className="font-condensed text-3xl leading-none font-bold tabular-nums">{count.format(s.value)}</dd>
                    <dd aria-hidden="true" className="mt-1 font-mono text-xs tracking-[0.1em] text-navy-900/75 uppercase">
                      {s.unit}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 font-mono text-xs tracking-[0.12em] text-navy-900/75 uppercase">
                {Object.values(crane.callouts).join(" · ")}
              </p>
            </div>
          </div>
        </Clip>
      </section>

      {/* 3: the truck taking the container. */}
      <section id="carga" data-m-section="" data-header-theme="light" className="relative bg-[#fefefe] text-navy-900">
        <Clip name="carga">
          <div className="m-in site-container absolute inset-x-0 top-20">
            <ContainerCode index={homeCode("carga")} label={scene("carga").code} />
          </div>
        </Clip>
      </section>

      {/* 4: the road, side on then from above; the services and differentials, then the history's chapters along
          the track to the CONE terminal, and its numbers. */}
      <section id="estrada" data-header-theme="light" className="relative bg-[#fefefe] text-navy-900">
        <div data-m-section="">
          <Clip name="estrada-a">
            <div className="m-in site-container absolute inset-x-0 top-20">
              <ContainerCode index={homeCode("estrada")} label={scene("estrada").code} />
              <p className="font-mono-tabular mt-2 text-sm text-navy-900/75">{road.highway}</p>
            </div>
          </Clip>
        </div>
        <div data-m-section="" data-header-theme="dark" className="bg-navy-900 py-16 text-sand-50">
          <div className="site-container">
            <p className="m-in font-condensed text-[1.8rem] leading-none font-bold uppercase">{road.title}</p>
            <ul className="mt-8 grid gap-8">
              {road.cards.map((card, i) => {
                const Icon = ROAD_ICONS[i];
                return (
                  <li key={card.title} className="m-in" style={delay(80 + i * 60)}>
                    <Icon aria-hidden="true" className="size-6 text-red-500" strokeWidth={1.5} />
                    <p className="mt-3 font-mono text-xs tracking-[0.12em] uppercase">{card.title}</p>
                    <p className="mt-2 text-sm leading-snug text-sand-50/80">{card.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <Clip name="estrada-b" />
        <div data-m-section="" className="site-container py-16">
          <p className="m-in font-condensed text-[2.4rem] leading-[0.9] font-bold uppercase">
            {track.title.map((line, i) => (
              <span key={line} className={`block ${i === 0 ? "text-navy-900/60" : ""}`}>
                {line}
              </span>
            ))}
          </p>
          <ol className="mt-10 grid gap-4">
            {history.map((ch, i) => (
              <li key={ch.title} data-chapter="" className="m-in border border-navy-900/15 bg-[#fefefe] p-4" style={delay(80 + i * 60)}>
                <ContainerCode index={homeCode("estrada")} label={`${String(i + 1).padStart(2, "0")}/${String(history.length).padStart(2, "0")}`} />
                <p className="font-condensed mt-3 text-[2.4rem] leading-none font-bold uppercase tabular-nums">{ch.mark}</p>
                <p className="mt-2 font-mono text-xs tracking-[0.12em] text-red-500 uppercase">{ch.title}</p>
                <p className="mt-1.5 text-[0.9375rem] leading-snug text-navy-900/80">{ch.text}</p>
              </li>
            ))}
          </ol>
          <div className="m-in mt-12">
            <Scoreboard />
          </div>
        </div>
      </section>

      {/* 5: the deliveries out of the terminal across Pernambuco and Bahia. */}
      <section id="distribuicao" data-m-section="" data-header-theme="dark" className="relative overflow-hidden bg-[#0a1338] py-24 text-sand-50">
        <div className="site-container">
          <div className="m-in">
            <ContainerCode index={homeCode("distribuicao")} label={scene("distribuicao").code} />
            <p className="mt-4">
              <span className="font-condensed block text-[4.5rem] leading-[0.85] font-bold tabular-nums">{count.format(distribution.count)}</span>
              <span className="font-condensed mt-2 block text-[1.5rem] leading-none font-bold uppercase">{distribution.unit}</span>
            </p>
          </div>
          <div className="m-routes relative mt-10 w-full" style={{ aspectRatio: HERO_FRAME.aspect }}>
            <StaticMap variant="distribution" fit animated className="absolute inset-0 h-full w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
