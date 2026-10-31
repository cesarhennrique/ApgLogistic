"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { viewOf } from "./ArrivalFrame";
import { CRANE, GROUND, ROPES, ROPE_WIDTH, SPREADER_BOX } from "./craneAnchors";
import { CONTAINER, sampleCraneCamera } from "./craneCamera";
import { cameraTransform } from "./oceanCamera";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";

const scene = site.journey.find((s) => s.id === "porteiner")!;
const HEIGHT_VH = 260;

// The script (spec §3), over the scene's progress: it opens on a close of the APG container under the spreader
// (scene 1 closed on one), and the camera pulls back (craneCamera) while the load rises out of the ship's hold to the
// trolley, decelerating, until the whole crane shows; it locks with a small settle; the copy comes in on the wide
// shot.
const LIFT = [0, 0.74] as const;
// Where the load starts: this far below the trolley (crane px).
const LIFT_FROM = 1000;
// The settle: 2 screen px down and back, over about 180 ms of an ordinary scroll (3% of the scene).
const SETTLE = [0.74, 0.77] as const;
const SETTLE_PX = 2;
const COPY_IN = [0.6, 0.72] as const;
const liftEase = gsap.parseEase("power2.out");

const base = (w: number, ext: string) => `/images/journey/porteiner-base-${w}.${ext}`;

// Scene 2: the APG container lifted out of the ship to the gantry crane's trolley.
export function CraneLift() {
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);
  // The moving parts (data-load, data-rope), gathered on the first draw (the scene may draw before this mounts).
  const parts = useRef<{ load: HTMLElement; ropes: HTMLElement[] } | null>(null);

  const apply = useCallback(() => {
    const w = world.current!;
    parts.current ??= {
      load: w.querySelector<HTMLElement>("[data-load]")!,
      ropes: [...w.querySelectorAll<HTMLElement>("[data-rope]")],
    };
    const { load, ropes } = parts.current;
    const p = reduced ? 1 : raw.current;
    const dy = (1 - liftEase(segment(p, ...LIFT))) * LIFT_FROM;
    const cam = sampleCraneCamera(p, viewOf(stage.current!), dy);
    w.style.transform = cameraTransform(cam);
    // The load in crane px (the camera scales it); the settle in screen px.
    const settle = (Math.sin(Math.PI * segment(p, ...SETTLE)) * SETTLE_PX) / cam.scale;
    load.style.transform = `translate3d(0, ${(dy + settle).toFixed(1)}px, 0)`;
    // The ropes from the trolley to the spreader: 1 px stretched to the gap.
    ROPES.forEach((r, i) => (ropes[i].style.transform = `scaleY(${(SPREADER_BOX.y - r.top + dy + settle).toFixed(1)})`));
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
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [apply]);

  return (
    <Scene id="porteiner" heightVh={HEIGHT_VH} background="#fefefe" headerTheme="light" onProgress={onProgress}>
      <div ref={stage} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {/* The crane image in a box of its own pixel size, placed by the camera. No will-change, so the close
            re-rasters sharp. */}
        <div ref={world} className="absolute top-0 left-0 origin-top-left" style={{ width: CRANE.width, height: CRANE.height }}>
          {/* A soft contact shadow under the legs. */}
          <div
            className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_19_56/0.22),transparent)]"
            style={{ left: GROUND.x0 - 160, width: GROUND.x1 - GROUND.x0 + 320, top: GROUND.y - 80, height: 160 }}
          />
          {/* The original (4488 px) on desktop, where the close needs it; 1920 on phones. */}
          <picture>
            <source media="(min-width: 768px)" type="image/avif" srcSet={base(4488, "avif")} />
            <source media="(min-width: 768px)" type="image/webp" srcSet={base(4488, "webp")} />
            <source type="image/avif" srcSet={base(1920, "avif")} />
            <img
              src={base(1920, "webp")}
              width={CRANE.width}
              height={CRANE.height}
              alt=""
              decoding="async"
              loading="lazy"
              className="absolute inset-0 h-full w-full"
            />
          </picture>
          {ROPES.map((r) => (
            <i
              key={r.x}
              data-rope=""
              className="absolute h-px origin-top bg-[#3a3d42]"
              style={{ left: r.x - ROPE_WIDTH / 2, top: r.top, width: ROPE_WIDTH }}
            />
          ))}
          {/* The load: the container under the spreader, moving as one. */}
          <div data-load="" className="absolute inset-0">
            <div className="absolute" style={{ left: CONTAINER.x, top: CONTAINER.top, width: CONTAINER.w }}>
              <SceneImage name="container-apg-lado" alt="" sizes="(min-width: 768px) 50vw, 45vw" className="block h-auto w-full" />
            </div>
            <div className="absolute" style={{ left: SPREADER_BOX.x, top: SPREADER_BOX.y, width: SPREADER_BOX.w }}>
              <SceneImage name="porteiner-spreader" alt="" sizes="(min-width: 768px) 55vw, 50vw" className="block h-auto w-full" />
            </div>
          </div>
        </div>
      </div>

      <div
        ref={copy}
        className="site-container absolute inset-x-0 top-[12svh] text-navy-900 opacity-0 md:top-1/2 md:-translate-y-1/2"
      >
        <div className="md:max-w-[36%]">
          <ContainerCode index={homeCode("porteiner")} label={scene.code} />
          <p className="font-condensed mt-4 max-w-[16ch] text-[clamp(2rem,5.6vw,5rem)] leading-[0.92] font-bold uppercase">
            {scene.text}
          </p>
        </div>
      </div>
    </Scene>
  );
}
