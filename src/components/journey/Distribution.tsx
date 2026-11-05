"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useQualityTier } from "@/lib/quality";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { distributionProgress } from "@/three/progress";
import { MAP_IN, PE_BA_BOUNDS, PULL_BACK, SALVADOR_AT, sampleDistributionCamera, smoother } from "@/three/stages/distributionCamera";
import { Scene, segment } from "./Scene";
import { StaticMap } from "./StaticMap";

const DistributionCanvas = dynamic(() => import("@/three/DistributionCanvas"), { ssr: false });

const scene = site.journey.find((s) => s.id === "distribuicao")!;
const { distribution: copyText, dock, mapLabels } = site.journeyScene;
const count = new Intl.NumberFormat("pt-BR");
const BACKGROUND = "#0a1338";
// 460vh: its first 100vh slide it in over scene 4's last screen (navy, the terminal's red point: this stage stays
// see-through and empty until it pins, on the very same picture), then 260 of script (its progress, c), then a
// screen held under the services' section sliding up over it.
const HEIGHT_VH = 460;
const SCRIPT = [100 / HEIGHT_VH, 360 / HEIGHT_VH] as const;
const PHONE = { head: 100, tail: 100, scale: 0.75 };
// The script (spec §3), over c: the map comes up round the terminal's point and the camera pulls back to PE and BA
// (distributionCamera) while the 24 deliveries branch out (DistributionStage); the copy in early, its counter
// climbing with the deliveries; the terminal's name out as the map opens, the hubs' names in.
const COPY_IN = [0.1, 0.18] as const;
const COUNT = [0.2, 0.9] as const;
const CONE_OUT = [0.14, 0.26] as const;
const HUBS_IN = [0.3, 0.42] as const;

// A label's left edge beside its point at x: right of it, or left of it where it would run off the screen.
const beside = (label: HTMLElement, x: number, width: number) => (x + 14 + label.offsetWidth <= width - 16 ? x + 14 : x - 14 - label.offsetWidth);

// Scene 5: the deliveries out of the terminal across Pernambuco and Bahia, on the hero's map.
export function Distribution() {
  const stage = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const coneLabel = useRef<HTMLParagraphElement>(null);
  const hubs = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const tier = useQualityTier();
  const still = useRef<HTMLDivElement>(null);
  const raw = useRef(0);
  const top = useRef<number | null>(null);
  // The canvas mounts once the scene is a screen away (and stays); it renders only while the scene is on screen.
  const [near, setNear] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const section = stage.current!.closest("section")!;
    const nearIo = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    const onIo = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting));
    nearIo.observe(section);
    onIo.observe(section);
    return () => {
      nearIo.disconnect();
      onIo.disconnect();
    };
  }, []);

  const apply = useCallback(() => {
    const el = stage.current!;
    // Sliding in over scene 4: see-through and empty, held still on screen (scene 4's last picture shows under it).
    // (the section's top from the scroll trigger; read from the layout only on a first draw or a resize)
    const stageTop = reduced ? 0 : Math.max(top.current ?? el.parentElement!.getBoundingClientRect().top, 0);
    const sliding = stageTop > 0;
    el.style.transform = sliding ? `translate(0, ${-stageTop}px)` : "";
    el.style.background = sliding ? "" : BACKGROUND;
    el.style.visibility = sliding ? "hidden" : "";

    const c = reduced ? 1 : segment(raw.current, ...SCRIPT);
    distributionProgress.value = c;
    distributionProgress.invalidate();
    const view = { width: el.clientWidth, height: el.clientHeight };
    const { scale, origin } = sampleDistributionCamera(smoother(c, PULL_BACK), view, PE_BA_BOUNDS);
    // The terminal's red point (scene 4's dock), and its name, then the two hubs' names.
    still.current!.style.transform = `translate3d(${origin.x.toFixed(1)}px, ${origin.y.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
    still.current!.style.opacity = String(smoother(c, MAP_IN));
    dot.current!.style.transform = `translate3d(${origin.x.toFixed(1)}px, ${origin.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    // (in once pinned: scene 4 hands over the point alone)
    const cone = segment(c, 0.01, 0.06) * (1 - segment(c, ...CONE_OUT));
    coneLabel.current!.style.opacity = String(cone);
    coneLabel.current!.style.transform = `translate3d(${beside(coneLabel.current!, origin.x, view.width).toFixed(1)}px, ${origin.y.toFixed(1)}px, 0) translateY(-50%)`;
    const [suape, salvador] = hubs.current!.children as HTMLCollectionOf<HTMLElement>;
    const hubsIn = String(segment(c, ...HUBS_IN));
    suape.style.opacity = salvador.style.opacity = hubsIn;
    suape.style.transform = `translate3d(${beside(suape, origin.x, view.width).toFixed(1)}px, ${(origin.y - 6).toFixed(1)}px, 0) translateY(-100%)`;
    const sx = origin.x + SALVADOR_AT.x * scale;
    salvador.style.transform = `translate3d(${beside(salvador, sx, view.width).toFixed(1)}px, ${(origin.y + SALVADOR_AT.z * scale).toFixed(1)}px, 0) translateY(-50%)`;
    copy.current!.style.opacity = String(segment(c, ...COPY_IN));
    counter.current!.textContent = count.format(Math.round(copyText.count * segment(c, ...COUNT)));
  }, [reduced]);

  const onProgress = useCallback(
    (p: number, t: number) => {
      raw.current = p;
      top.current = t;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    apply();
    const observer = new ResizeObserver(() => {
      top.current = null;
      apply();
    });
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [apply]);

  return (
    <Scene
      id="distribuicao"
      heightVh={HEIGHT_VH}
      phone={PHONE}
      // see-through while it slides in (the stage paints its own background once pinned)
      background="transparent"
      headerTheme="dark"
      // over scene 4's last screen: it slides in on top of the same navy and the same red point
      from="slide"
      onProgress={onProgress}
    >
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0">
          {near && tier !== null && tier !== "static" && <DistributionCanvas onScreen={onScreen || reduced} />}
          {/* the 'static' tier (lib/quality): the map as a still picture, placed by the same camera */}
          <div ref={still} className="absolute top-0 left-0 origin-top-left">
            {tier === "static" && <StaticMap variant="distribution" />}
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div ref={dot} className="suape-dot absolute top-0 left-0 size-3 rounded-full bg-red-500" />
          <p ref={coneLabel} className="absolute top-0 left-0 font-mono text-xs tracking-[0.16em] whitespace-nowrap text-sand-50 uppercase opacity-0">
            {dock.label}
          </p>
          <div ref={hubs}>
            {[mapLabels.suape, mapLabels.salvador].map((label) => (
              <p key={label} className="absolute top-0 left-0 font-mono text-xs tracking-[0.16em] whitespace-nowrap text-sand-50 opacity-0">
                {label}
              </p>
            ))}
          </div>
        </div>
        <div
          ref={copy}
          className="site-container absolute inset-x-0 text-sand-50 opacity-0 max-md:bottom-[9svh] md:top-1/2 md:-translate-y-1/2"
        >
          <ContainerCode index={homeCode("distribuicao")} label={scene.code} />
          <p className="mt-4 max-w-[14ch]">
            <span ref={counter} className="font-condensed block text-[clamp(4.5rem,11vw,9rem)] leading-[0.85] font-bold tabular-nums">
              {count.format(copyText.count)}
            </span>
            <span className="font-condensed mt-2 block text-[clamp(1.5rem,2.6vw,2.4rem)] leading-none font-bold uppercase">
              {copyText.unit}
            </span>
          </p>
        </div>
      </div>
    </Scene>
  );
}
