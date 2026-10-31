"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { CRANE, GROUND, ROPES, SPREADER, SPREADER_BOX } from "./craneAnchors";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";

const scene = site.journey.find((s) => s.id === "porteiner")!;
const HEIGHT_VH = 240;

// The script (spec §3), over the scene's progress: the copy comes in; the spreader, the APG container under it,
// rises from below the frame (the ship's hold) to the trolley, decelerating; it locks with a small settle.
const COPY_IN = [0.04, 0.16] as const;
const LIFT = [0.06, 0.7] as const;
// The settle: 2 px down and back, over about 180 ms of an ordinary scroll (3% of the scene).
const SETTLE = [0.7, 0.73] as const;
const SETTLE_PX = 2;
const liftEase = gsap.parseEase("power2.out");

// Crane image px as a share of its box.
const pctX = (x: number) => `${(x / CRANE.width) * 100}%`;
const pctY = (y: number) => `${(y / CRANE.height) * 100}%`;
// The container under the spreader: the spreader's width, its top just under the spreader's locks.
const CONTAINER_TOP = SPREADER.bottom - 4;

// Scene 2: the whole gantry crane at the right; the APG container lifted out of the ship to its trolley.
export function CraneLift() {
  const crane = useRef<HTMLDivElement>(null);
  // The moving parts (data-load, data-rope), gathered on the first draw (the scene may draw before this mounts).
  const parts = useRef<{ load: HTMLElement[]; ropes: HTMLElement[] } | null>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const box = crane.current!;
    parts.current ??= {
      load: [...box.querySelectorAll<HTMLElement>("[data-load]")],
      ropes: [...box.querySelectorAll<HTMLElement>("[data-rope]")],
    };
    const { load, ropes } = parts.current;
    const s = box.offsetHeight / CRANE.height;
    // Below the frame at the start: the spreader's top under the stage's bottom edge (measured in the stage, so
    // the same before and after it pins).
    const stage = box.parentElement!;
    const top = box.getBoundingClientRect().top - stage.getBoundingClientRect().top;
    const below = stage.clientHeight - (top + SPREADER_BOX.y * s) + 12;
    const p = reduced ? 1 : raw.current;
    const settle = Math.sin(Math.PI * segment(p, ...SETTLE)) * SETTLE_PX;
    const dy = (1 - liftEase(segment(p, ...LIFT))) * below + settle;
    for (const el of load) el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    // The ropes run from the trolley to the spreader: their length is the gap, stretched from 1 px.
    ROPES.forEach((r, i) => {
      ropes[i].style.transform = `scaleY(${((SPREADER_BOX.y - r.top) * s + dy).toFixed(1)})`;
    });
    const copyIn = reduced ? 1 : segment(p, ...COPY_IN);
    copy.current!.style.opacity = String(copyIn);
    copy.current!.style.transform = `translate3d(0, ${((1 - copyIn) * 16).toFixed(1)}px, 0)`;
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      raw.current = p;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(crane.current!);
    return () => observer.disconnect();
  }, [apply]);

  return (
    <Scene id="porteiner" heightVh={HEIGHT_VH} background="#fefefe" headerTheme="light" onProgress={onProgress}>
      <div
        ref={copy}
        className="site-container absolute inset-x-0 top-[13svh] text-navy-900 opacity-0 md:top-1/2 md:-translate-y-1/2"
      >
        <div className="md:max-w-[38%]">
          <ContainerCode index={homeCode("porteiner")} label={scene.code} />
          <p className="font-condensed mt-4 max-w-[16ch] text-[clamp(2rem,5.6vw,5rem)] leading-[0.92] font-bold uppercase">
            {scene.text}
          </p>
        </div>
      </div>

      {/* The crane: its feet on the ground at the bottom, the boom reaching left over the copy's side. */}
      <div
        ref={crane}
        aria-hidden="true"
        className="absolute right-[-12vw] bottom-[3svh] aspect-[1122/1402] h-[60svh] md:right-[4vw] md:h-[85svh]"
      >
        {/* A soft contact shadow under the legs. */}
        <div
          className="absolute h-[3%] -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_19_56/0.22),transparent)]"
          style={{ left: pctX(GROUND.x0 - 40), width: pctX(GROUND.x1 - GROUND.x0 + 80), top: pctY(GROUND.y) }}
        />
        <SceneImage name="porteiner-base" alt="" sizes="(min-width: 768px) 68svh, 48svh" className="absolute inset-0 h-full w-full" />
        {ROPES.map((r) => (
          <i
            key={r.x}
            data-rope=""
            className="absolute h-px w-[0.25%] min-w-[1.5px] origin-top -translate-x-1/2 bg-[#3a3d42]"
            style={{ left: pctX(r.x), top: pctY(r.top) }}
          />
        ))}
        {/* The load: the container under the spreader, moving as one. */}
        <div
          data-load=""
          className="absolute"
          style={{ left: pctX(SPREADER.x), top: pctY(CONTAINER_TOP), width: pctX(SPREADER.w) }}
        >
          <SceneImage name="container-apg-lado" alt="" sizes="(min-width: 768px) 12svh, 9svh" className="block h-auto w-full" />
        </div>
        <div
          data-load=""
          className="absolute"
          style={{ left: pctX(SPREADER_BOX.x), top: pctY(SPREADER_BOX.y), width: pctX(SPREADER_BOX.w) }}
        >
          <SceneImage name="porteiner-spreader" alt="" sizes="(min-width: 768px) 12svh, 9svh" className="block h-auto w-full" />
        </div>
      </div>
    </Scene>
  );
}
