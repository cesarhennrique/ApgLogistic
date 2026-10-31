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
// 320vh: 220 of scroll; scene 4 slides in over its last 100vh, showing the same truck (Road), so the script
// below runs over the first 120vh (its progress, c) and the end holds under the slide.
const HEIGHT_VH = 320;
const SCRIPT_END = 120 / (HEIGHT_VH - 100);

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
// Phones: a closer camera, the container (and the chassis under it) ~140% of the screen's width, centred on it;
// after the set-down it pulls back, exponentially, to the whole truck (TRUCK_FRAME).
const CLOSE_SHARE = 1.4;
const RECEDE = [0.68, 0.92] as const;

// The truck's framing: ~90vw wide, a little below the middle. Scene 4 opens on the same box.
export const TRUCK_FRAME = "absolute left-1/2 top-[54%] aspect-[1672/941] w-[90vw] -translate-x-1/2 -translate-y-1/2";
const FRAME = { width: 0.9, top: 0.54 };
// Truck image px as a share of its box.
const pctX = (x: number) => `${(x / TRUCK.width) * 100}%`;
const pctY = (y: number) => `${(y / TRUCK.height) * 100}%`;
// The container's box in the truck, as a clip, with 10 px of white above it and 8 px right of it (white in both
// trucks there, so the clip's antialiased edge falls on white). Scene 4 draws its truck the same way.
export const CONTAINER_CLIP = `inset(${pctY(CONTAINER_BOX.y - 10)} ${pctX(TRUCK.width - CONTAINER_BOX.x - CONTAINER_BOX.w - 8)} ${pctY(TRUCK.height - CONTAINER_BOX.y - CONTAINER_BOX.h)} ${pctX(CONTAINER_BOX.x)})`;
// Where the four ropes hold the container, as a share of its length.
const ROPE_AT = [0.1, 0.36, 0.64, 0.9];

// Scene 3: a close on the empty truck; the APG container set down on it.
export function Load() {
  const stage = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const ropes = useRef<HTMLDivElement>(null);
  const loaded = useRef<HTMLDivElement>(null);
  const locks = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const W = stage.current!.clientWidth;
    const H = stage.current!.clientHeight;
    const p = reduced ? 1 : Math.min(raw.current / SCRIPT_END, 1);
    // The truck's box (its layout, TRUCK_FRAME) and the container's centre in it, in stage px.
    const bw = FRAME.width * W;
    const s = bw / TRUCK.width;
    const top = FRAME.top * H - (TRUCK.height * s) / 2;
    const cx = (W - bw) / 2 + (CONTAINER_BOX.x + CONTAINER_BOX.w / 2) * s;
    const cy = top + (CONTAINER_BOX.y + CONTAINER_BOX.h / 2) * s;

    // The camera (phones): scale z about the stage's top left, the container at the screen's centre while close,
    // back to the plain frame (z = 1, no shift) as it pulls back, in step with the scale.
    const z0 = W < 768 ? Math.max((CLOSE_SHARE * W) / (CONTAINER_BOX.w * s), 1) : 1;
    const z = z0 ** (1 - segment(p, ...RECEDE));
    const k = z0 > 1 ? (1 - z0 / z) / (1 - z0) : 1;
    const tx = W / 2 + (cx - W / 2) * k - z * cx;
    const ty = H / 2 + (cy - H / 2) * k - z * cy;
    truck.current!.parentElement!.style.transform =
      // back at the plain frame: no transform at all, so it rasterises as scene 4's truck does
      z0 > 1 && z > 1 ? `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(${z.toFixed(4)})` : "";

    // Above the frame at the start: the container's bottom over the screen's top edge.
    const above = ty / z + top + (CONTAINER_BOX.y + CONTAINER_BOX.h) * s + 12 / z;
    const dy = -(1 - lowerEase(segment(p, ...LOWER))) * above;
    // Seated: no transform at all, so it rasterises exactly as the loaded truck over it does.
    container.current!.style.transform = dy < 0 ? `translate3d(0, ${dy.toFixed(1)}px, 0)` : "none";
    // The ropes come down with it, then rise away from it.
    const rise = segment(p, ...ROPES_OUT);
    ropes.current!.style.transform = `translate3d(0, ${(dy - (rise * H) / z).toFixed(1)}px, 0)`;
    ropes.current!.style.opacity = String(reduced ? 0 : 1 - rise);
    const swap = segment(p, ...SWAP);
    loaded.current!.style.opacity = String(swap);
    // Swapped: the loaded truck alone over the empty one, as the container was: the very same picture (two
    // identical layers would blend their antialiased clip edge twice).
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
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [apply]);

  return (
    <Scene id="carga" heightVh={HEIGHT_VH} background="#fefefe" headerTheme="light" onProgress={onProgress}>
      <div ref={stage} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 origin-top-left">
          <div ref={truck} className={TRUCK_FRAME}>
            <SceneImage name="carreta-lado-vazia" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="absolute inset-0 h-full w-full" />
            {/* The container: the loaded truck itself, clipped to the container's box (container-apg-lado is that
                same cut). Drawn in the truck's own box, so its pixels land exactly where the loaded truck's do: a
                separate cut-out at a fractional offset rounds differently and its edges flicker at the swap. */}
            <div ref={container} className="absolute inset-0" style={{ clipPath: CONTAINER_CLIP }}>
              <SceneImage name="carreta-lado" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="h-full w-full" />
            </div>
            {/* The swap to the loaded truck, within the container's box: outside it the two renders differ in edge
                detail (cab, wheels) and would shimmer. */}
            <div ref={loaded} className="absolute inset-0 opacity-0" style={{ clipPath: CONTAINER_CLIP }}>
              <SceneImage name="carreta-lado" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="h-full w-full" />
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
                  className="absolute bottom-0 h-[150vh] w-[2px] -translate-x-1/2 bg-[#3a3d42] max-md:w-px"
                  style={{ left: `${at * 100}%` }}
                />
              ))}
            </div>
            <div ref={locks} className="absolute inset-0 opacity-0">
              {TWIST_LOCKS.map((l) => (
                <i
                  key={l.x}
                  className="absolute size-2 rounded-full bg-red-500 ring-2 ring-white/80 max-md:size-1 max-md:ring-1 md:size-2.5"
                  style={{ left: pctX(l.x), top: pctY(l.y) }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="site-container absolute inset-x-0 top-[13svh] text-navy-900">
        <ContainerCode index={homeCode("carga")} label={scene.code} />
      </div>
    </Scene>
  );
}
