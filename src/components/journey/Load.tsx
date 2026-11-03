"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { viewOf } from "./ArrivalFrame";
import { CONTAINER_BOX, ROPES, ROPE_WIDTH, SPREADER_BOX, TRUCK, TWIST_LOCKS } from "./craneAnchors";
import { CONTAINER, HANDOFF_GAP, PX_PER_M, TRUCK_SCALE, craneHandoff } from "./craneCamera";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";
import { TruckShadow } from "./TruckShadow";

const scene = site.journey.find((s) => s.id === "carga")!;
// 320vh: its first 100vh slide it in over scene 2's last screen (the same truck, the same container: this stage
// stays see-through and empty until it pins), then 120 of script (its progress, c), then the end holds while scene 4
// slides in over it.
const HEIGHT_VH = 320;
// Phones: ×0.75, but the slide in over scene 2 and the hold under scene 4's slide (a screen each).
const PHONE = { head: 100, tail: 100, scale: 0.75 };
const SLIDE_END = 100 / HEIGHT_VH;
const SCRIPT = [SLIDE_END, SLIDE_END + 120 / HEIGHT_VH] as const;
const BACKGROUND = "#fefefe";

// The script (spec §3), over c: it opens on scene 2's last picture (the container on its spreader, a hand's breadth
// above the truck, still coming down; craneHandoff) and sets it down within the first steps (no dead scroll across
// the hand-over), the camera easing to its own framing; at the set-down the twist locks light up and the empty truck swaps for the loaded one (over about 120 ms of an ordinary
// scroll); the spreader lets go and rises away on its ropes; the locks fade, leaving the loaded truck as scene 4
// opens on it.
const LOWER = [0, 0.06] as const;
const COTA_OUT = [0.07, 0.13] as const;
const LOCKS_IN = [0.06, 0.11] as const;
const SWAP = [0.09, 0.12] as const;
const LIFT_OFF = [0.13, 0.6] as const;
const LOCKS_OUT = [0.55, 0.95] as const;
const lowerEase = gsap.parseEase("power2.out");
// Phones: seated, the camera is close (the container ~140% of the screen's width, centred), then pulls back,
// exponentially, to the whole truck (TRUCK_FRAME).
const CLOSE_SHARE = 1.4;
const RECEDE = [0.2, 0.6] as const;

// The truck's framing: ~90vw wide, a little below the middle. Scene 4 opens on the same box.
export const TRUCK_FRAME = "absolute left-1/2 top-[54%] aspect-[1672/941] w-[90vw] -translate-x-1/2 -translate-y-1/2";
const FRAME = { width: 0.9, top: 0.54 };
// Truck image px as a share of its box.
const pctX = (x: number) => `${(x / TRUCK.width) * 100}%`;
const pctY = (y: number) => `${(y / TRUCK.height) * 100}%`;
// The container's box in the truck, as a clip, with 10 px of white above it and 8 px right of it (white in both
// trucks there, so the clip's antialiased edge falls on white). Scene 4 draws its truck the same way.
export const CONTAINER_CLIP = `inset(${pctY(CONTAINER_BOX.y - 10)} ${pctX(TRUCK.width - CONTAINER_BOX.x - CONTAINER_BOX.w - 8)} ${pctY(TRUCK.height - CONTAINER_BOX.y - CONTAINER_BOX.h)} ${pctX(CONTAINER_BOX.x)})`;
// Scene 2's spreader and ropes, carried over in truck px (the crane's px over TRUCK_SCALE), placed from the container.
const toTruck = (crane: number) => crane / TRUCK_SCALE;
const SPREADER_IN_TRUCK = {
  x: CONTAINER_BOX.x + toTruck(SPREADER_BOX.x - CONTAINER.x),
  y: CONTAINER_BOX.y + toTruck(SPREADER_BOX.y - CONTAINER.top),
  w: toTruck(SPREADER_BOX.w),
};
const ROPES_IN_TRUCK = ROPES.map((r) => CONTAINER_BOX.x + toTruck(r.x - CONTAINER.x));
const GAP = toTruck(HANDOFF_GAP);
const COTA_X = `calc(${pctX(CONTAINER_BOX.x + CONTAINER_BOX.w)} + 14px)`;
const COTA_X_PHONE = pctX(CONTAINER_BOX.x + CONTAINER_BOX.w / 2);
const metres = (truckPx: number) => `${((truckPx * TRUCK_SCALE) / PX_PER_M).toFixed(1).replace(".", ",")} m`;

type Framing = { z: number; x: number; y: number };
// From one framing to another (the truck's zoom and its centre on screen), exponentially, about a fixed point.
const between = (a: Framing, b: Framing, u: number): Framing => {
  const z = a.z * (b.z / a.z) ** u;
  const k = a.z !== b.z ? (1 - a.z / z) / (1 - a.z / b.z) : u;
  return { z, x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
};

// Scene 3: the APG container set down on the empty truck.
export function Load() {
  const stage = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const cota = useRef<HTMLDivElement>(null);
  const loaded = useRef<HTMLDivElement>(null);
  const locks = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const el = stage.current!;
    // Sliding in over scene 2: see-through and empty, held still on screen (scene 2's own close shows under it).
    const stageTop = reduced ? 0 : Math.max(el.parentElement!.getBoundingClientRect().top, 0);
    const sliding = stageTop > 0;
    el.style.transform = sliding ? `translate(0, ${-stageTop}px)` : "";
    el.style.background = sliding ? "" : BACKGROUND;
    el.style.visibility = sliding ? "hidden" : "";

    const W = el.clientWidth;
    const H = el.clientHeight;
    const c = reduced ? 1 : segment(raw.current, ...SCRIPT);
    // The truck's box (its layout, TRUCK_FRAME) and its centre and the container's, in stage px.
    const bw = FRAME.width * W;
    const s = bw / TRUCK.width;
    const top = FRAME.top * H - (TRUCK.height * s) / 2;
    const left = (W - bw) / 2;
    const centre = { x: left + bw / 2, y: top + (TRUCK.height * s) / 2 };
    const box = { x: left + (CONTAINER_BOX.x + CONTAINER_BOX.w / 2) * s, y: top + (CONTAINER_BOX.y + CONTAINER_BOX.h / 2) * s };

    // The camera: from scene 2's last framing, to the seated one (phones: close on the container), then (phones)
    // back to the plain frame.
    const hand = craneHandoff(viewOf(el)).truck;
    const handoff = { z: hand.w / bw, x: hand.x + hand.w / 2, y: hand.y + hand.h / 2 };
    const plain = { z: 1, x: centre.x, y: centre.y };
    const zClose = Math.max((CLOSE_SHARE * W) / (CONTAINER_BOX.w * s), 1);
    const seated = W < 768 ? { z: zClose, x: W / 2 + zClose * (centre.x - box.x), y: H / 2 + zClose * (centre.y - box.y) } : plain;
    const recede = segment(c, ...RECEDE);
    const f = recede > 0 ? between(seated, plain, recede) : between(handoff, seated, segment(c, ...LOWER));
    const [tx, ty] = [f.x - f.z * centre.x, f.y - f.z * centre.y];
    // the plain frame: no transform at all, so it rasterises as scene 4's truck does
    truck.current!.parentElement!.style.transform =
      Math.abs(f.z - 1) > 1e-4 || Math.abs(tx) > 0.05 || Math.abs(ty) > 0.05 ? `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${f.z.toFixed(5)})` : "";

    // The container (with its spreader) from scene 2's gap above its seat down to it.
    const dy = -(1 - lowerEase(segment(c, ...LOWER))) * GAP * s;
    // Seated: no transform at all, so it rasterises exactly as the loaded truck over it does.
    container.current!.style.transform = dy < 0 ? `translate3d(0, ${dy.toFixed(2)}px, 0)` : "none";
    // The spreader lets go and rises on its ropes, away out of the frame.
    const off = segment(c, ...LIFT_OFF);
    lift.current!.style.transform = `translate3d(0, ${(dy - (off * H) / f.z).toFixed(1)}px, 0)`;
    lift.current!.style.opacity = String(reduced ? 0 : 1 - off);
    // The container's height above its seat (scene 2's dimension, down to 0).
    const [line, mark, label] = cota.current!.children as HTMLCollectionOf<HTMLElement>;
    // Right of the container; on phones (the container wider than the screen) inside it, at its middle.
    cota.current!.style.left = W < 768 ? COTA_X_PHONE : COTA_X;
    cota.current!.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    line.style.transform = `scaleY(${(-dy).toFixed(1)})`;
    mark.style.transform = `translate3d(0, ${(-dy).toFixed(1)}px, 0)`;
    label.textContent = metres(-dy / s);
    // halfway down the line, as scene 2 sets it
    label.style.transform = `translate3d(0, ${(-dy / 2).toFixed(1)}px, 0) translateY(-50%)`;
    cota.current!.style.opacity = String(reduced ? 0 : 1 - segment(c, ...COTA_OUT));

    const swap = segment(c, ...SWAP);
    loaded.current!.style.opacity = String(swap);
    // Swapped: the loaded truck alone over the empty one, as the container was: the very same picture (two
    // identical layers would blend their antialiased clip edge twice).
    container.current!.style.visibility = swap >= 1 ? "hidden" : "";
    const lockIn = segment(c, ...LOCKS_IN);
    locks.current!.style.opacity = String(reduced ? 1 : lockIn * (1 - segment(c, ...LOCKS_OUT)));
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
    <Scene
      id="carga"
      heightVh={HEIGHT_VH}
      // see-through while it slides in (the stage paints its own background once pinned)
      background="transparent"
      headerTheme="light"
      // over scene 2's last screen: it slides in on top of the same picture
      from="slide"
      onProgress={onProgress}
      phone={PHONE}
    >
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 origin-top-left">
          <div ref={truck} className={TRUCK_FRAME}>
            <TruckShadow />
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
            {/* Scene 2's spreader on the container, and its ropes up out of the frame. */}
            <div ref={lift} data-lift="" className="absolute inset-0">
              {ROPES_IN_TRUCK.map((x) => (
                <i
                  key={x}
                  className="absolute h-[150vh] -translate-x-1/2 -translate-y-full bg-[#3a3d42]"
                  style={{ left: pctX(x), top: pctY(SPREADER_IN_TRUCK.y), width: pctX(toTruck(ROPE_WIDTH)) }}
                />
              ))}
              <div className="absolute" style={{ left: pctX(SPREADER_IN_TRUCK.x), top: pctY(SPREADER_IN_TRUCK.y), width: pctX(SPREADER_IN_TRUCK.w) }}>
                <SceneImage name="porteiner-spreader" alt="" sizes="(min-width: 768px) 75vw, 150vw" className="block h-auto w-full" />
              </div>
            </div>
            {/* The container's height above its seat, down to 0 (scene 2's dimension, carried on). */}
            <div
              ref={cota}
              data-cota=""
              className="absolute"
              style={{ left: COTA_X, top: pctY(CONTAINER_BOX.y + CONTAINER_BOX.h) }}
            >
              <i className="absolute top-0 left-0 h-px w-[1.5px] origin-top bg-red-500" />
              <i className="absolute top-0 -left-1.5 h-[1.5px] w-[13px] bg-red-500" />
              <span className="absolute top-0 left-2.5 bg-[#fefefe] px-1.5 font-mono text-xs whitespace-nowrap text-red-500 tabular-nums" />
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

        <div className="site-container absolute inset-x-0 top-[13svh] text-navy-900">
          <ContainerCode index={homeCode("carga")} label={scene.code} />
        </div>
      </div>
    </Scene>
  );
}
