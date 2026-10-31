"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { CONTAINER_BOX, TRUCK, TWIST_LOCKS } from "./craneAnchors";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";

const scene = site.journey.find((s) => s.id === "carga")!;
const HEIGHT_VH = 220;

// The script (spec §3), over the scene's progress: the container comes down from above the frame on four ropes
// and sets down on the chassis, slowing to it; at the set-down the twist locks light up and the empty truck swaps
// for the loaded one (over about 120 ms of an ordinary scroll); the ropes rise away; the locks fade, leaving the
// loaded truck as scene 4 (the road) opens on it.
const LOWER = [0.06, 0.6] as const;
const LOCKS_IN = [0.6, 0.63] as const;
const SWAP = [0.62, 0.64] as const;
const ROPES_OUT = [0.66, 0.82] as const;
const LOCKS_OUT = [0.86, 0.96] as const;
const lowerEase = gsap.parseEase("power2.out");

// The truck's framing: ~90vw wide, a little below the middle. Scene 4 opens on the same box (shortcut: the road is
// still a placeholder; J4 reuses TRUCK_FRAME so the hand-over is seamless).
export const TRUCK_FRAME = "absolute left-1/2 top-[54%] aspect-[1672/941] w-[90vw] -translate-x-1/2 -translate-y-1/2";
// Truck image px as a share of its box.
const pctX = (x: number) => `${(x / TRUCK.width) * 100}%`;
const pctY = (y: number) => `${(y / TRUCK.height) * 100}%`;
// The container's box in the truck, as a clip. An antialiased clip edge on the container's own edge blends twice
// at the swap (container over truck, then loaded over that), so: 10 px of white above it and 8 px right of it
// (white in both trucks there); its left edge (against the cab's hoses) and its bottom (on the chassis) snapped to
// device pixels, the bottom as placed once the stage pins (clipFor).
const CLIP = { top: CONTAINER_BOX.y - 10, right: CONTAINER_BOX.x + CONTAINER_BOX.w + 8 };
const clipFor = (box: HTMLElement) => {
  const r = box.getBoundingClientRect();
  const top = r.top - box.parentElement!.getBoundingClientRect().top;
  const dpr = window.devicePixelRatio || 1;
  const snap = (v: number) => Math.round(v * dpr) / dpr;
  const left = snap(r.left + (CONTAINER_BOX.x / TRUCK.width) * r.width) - r.left;
  const bottom = top + r.height - snap(top + ((CONTAINER_BOX.y + CONTAINER_BOX.h) / TRUCK.height) * r.height);
  return `inset(${pctY(CLIP.top)} ${pctX(TRUCK.width - CLIP.right)} ${bottom.toFixed(3)}px ${left.toFixed(3)}px)`;
};
// Where the four ropes hold the container, as a share of its length.
const ROPE_AT = [0.1, 0.36, 0.64, 0.9];

// Scene 3: a close on the empty truck; the APG container set down on it.
export function Load() {
  const truck = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const ropes = useRef<HTMLDivElement>(null);
  const loaded = useRef<HTMLDivElement>(null);
  const locks = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const box = truck.current!;
    // The clip follows the layout (written only when it changes).
    const clip = clipFor(box);
    if (clip !== container.current!.style.clipPath) container.current!.style.clipPath = loaded.current!.style.clipPath = clip;
    const s = box.offsetHeight / TRUCK.height;
    // Above the frame at the start: the container's bottom over the stage's top edge (measured in the stage).
    const top = box.getBoundingClientRect().top - box.parentElement!.getBoundingClientRect().top;
    const above = top + (CONTAINER_BOX.y + CONTAINER_BOX.h) * s + 12;
    const p = reduced ? 1 : raw.current;
    const dy = -(1 - lowerEase(segment(p, ...LOWER))) * above;
    // Seated: no transform at all, so it rasterises exactly as the loaded truck over it does.
    container.current!.style.transform = dy < 0 ? `translate3d(0, ${dy.toFixed(1)}px, 0)` : "none";
    // The ropes come down with it, then rise away from it.
    const rise = segment(p, ...ROPES_OUT);
    ropes.current!.style.transform = `translate3d(0, ${(dy - rise * window.innerHeight * 0.5).toFixed(1)}px, 0)`;
    ropes.current!.style.opacity = String(reduced ? 0 : 1 - rise);
    const swap = segment(p, ...SWAP);
    loaded.current!.style.opacity = String(swap);
    // Swapped: the loaded truck alone over the empty one, as the container was (two identical layers would blend
    // their antialiased clip edge twice).
    container.current!.style.visibility = swap >= 1 ? "hidden" : "";
    const lockIn = segment(p, ...LOCKS_IN);
    locks.current!.style.opacity = String(reduced ? 1 : lockIn * (1 - segment(p, ...LOCKS_OUT)));
    for (const dot of locks.current!.children as HTMLCollectionOf<HTMLElement>) {
      dot.style.transform = `translate(-50%, -50%) scale(${(0.6 + 0.4 * lockIn).toFixed(3)})`;
    }
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
    observer.observe(truck.current!);
    return () => observer.disconnect();
  }, [apply]);

  return (
    <Scene id="carga" heightVh={HEIGHT_VH} background="#fefefe" headerTheme="light" onProgress={onProgress}>
      <div className="site-container absolute inset-x-0 top-[13svh] z-10 text-navy-900">
        <ContainerCode index={homeCode("carga")} label={scene.code} />
      </div>

      <div ref={truck} aria-hidden="true" className={TRUCK_FRAME}>
        <SceneImage name="carreta-lado-vazia" alt="" sizes="90vw" full className="absolute inset-0 h-full w-full" />
        {/* The container: the loaded truck itself, clipped to the container's box (container-apg-lado is that same
            cut). Drawn in the truck's own box, so its pixels land exactly where the loaded truck's do: a separate
            cut-out at a fractional offset rounds differently and its edges flicker at the swap. */}
        <div ref={container} className="absolute inset-0">
          <SceneImage name="carreta-lado" alt="" sizes="90vw" full className="h-full w-full" />
        </div>
        {/* The swap to the loaded truck, within the container's box: outside it the two renders differ in edge detail
            (cab, wheels) and would shimmer. */}
        <div ref={loaded} className="absolute inset-0 opacity-0">
          <SceneImage name="carreta-lado" alt="" sizes="90vw" full className="h-full w-full" />
        </div>
        {/* The ropes up out of the frame, from the container's top. */}
        <div
          ref={ropes}
          className="absolute"
          style={{ left: pctX(CONTAINER_BOX.x), top: pctY(CONTAINER_BOX.y), width: pctX(CONTAINER_BOX.w) }}
        >
          {ROPE_AT.map((at) => (
            <i
              key={at}
              className="absolute bottom-0 h-[150vh] w-[2px] -translate-x-1/2 bg-[#3a3d42]"
              style={{ left: `${at * 100}%` }}
            />
          ))}
        </div>
        <div ref={locks} className="absolute inset-0 opacity-0">
          {TWIST_LOCKS.map((l) => (
            <i
              key={l.x}
              className="absolute size-2 rounded-full bg-red-500 ring-2 ring-white/80 md:size-2.5"
              style={{ left: pctX(l.x), top: pctY(l.y) }}
            />
          ))}
        </div>
      </div>
    </Scene>
  );
}
