"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { TRUCK } from "./craneAnchors";
import { CONTAINER_CLIP, TRUCK_FRAME } from "./Load";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";

const scene = site.journey.find((s) => s.id === "estrada")!;
const HEIGHT_VH = 300;
const BACKGROUND = "#fefefe";

// Scene 4 (spec §3; the /dev/prova proof promoted): it slides in over scene 3's last screen with the same loaded
// truck in the same frame (TRUCK_FRAME), its stage held still on screen, so the truck never moves at the hand-over;
// the road and the copy are revealed as it slides. Then the truck pulls away to the left, wheels turning with the
// distance, the red trail drawn behind it, the speedometer counting up.
const SLIDE_END = 100 / HEIGHT_VH;
// Over the scene's progress after the slide (q).
const DRIVE = [0.12, 0.92] as const;
const driveEase = gsap.parseEase("power2.in");
const TOP_SPEED = 80;

// The truck as scene 3 leaves it, layer for layer, so the hand-over is the same picture: the empty truck with the
// loaded one's container over it (CONTAINER_CLIP). The wheel hubs and the road, measured on them (aligned to the
// pixel); the turning wheels are discs of the empty truck's image.
const IMG = "/images/journey/carreta-lado-vazia-1672.webp";
const WHEELS = [172, 578, 1216, 1357, 1498].map((x) => ({ x, y: 639 }));
// Rotating disc radius: the cut falls on the plain sidewall (rim lip ends ~40, tyre ~61), so the seam is invisible.
const RIM_R = 54;
// The tyres' contact line, and the truck's rear.
const ROAD_Y = 700;
const REAR_X = 1640;
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

export function Road() {
  const stage = useRef<HTMLDivElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const drive = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);
  const road = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const el = stage.current!;
    // Sliding in over scene 3: the stage held still on screen, see-through and without its truck, so scene 3's truck
    // shows under the road and the copy coming in (a copy of the truck at a fractional offset rounds a device pixel
    // apart). Pinned, it is opaque with its own truck, on the very pixels of scene 3's.
    const stageTop = reduced ? 0 : Math.max(el.parentElement!.getBoundingClientRect().top, 0);
    const sliding = stageTop > 0;
    el.style.transform = sliding ? `translate(0, ${-stageTop}px)` : "";
    el.style.background = sliding ? "" : BACKGROUND;
    truck.current!.style.visibility = sliding ? "hidden" : "";
    const p = reduced ? 0 : raw.current;
    const reveal = reduced ? 1 : segment(p, SLIDE_END * 0.6, SLIDE_END);
    road.current!.style.opacity = String(reveal);
    copy.current!.style.opacity = String(reveal);

    const W = el.clientWidth;
    const bw = truck.current!.offsetWidth;
    const s = bw / TRUCK.width;
    const left = (W - bw) / 2;
    const t = segment(segment(p, SLIDE_END, 1), ...DRIVE);
    // Off the left edge at the end.
    const x = -driveEase(t) * (left + bw + 40);
    drive.current!.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    // Rolling, not sliding: the wheels turn by the distance over the tyre's radius.
    const deg = (x / ((ROAD_Y - WHEELS[0].y) * s)) * (180 / Math.PI);
    // Parked, the discs are out (display: none, so their image is not even fetched before the scene: it competed
    // with the hero's LCP); a disc also resamples the image a hair differently from the image under it.
    for (const rim of drive.current!.querySelectorAll<HTMLElement>("[data-rim]")) {
      rim.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      rim.style.display = x < 0 ? "block" : "";
    }
    // The trail: from the screen's right edge to the truck's rear.
    trail.current!.style.transform = `scaleX(${Math.min(Math.max((W - (left + REAR_X * s + x)) / W, 0), 1).toFixed(4)})`;
    // Speed grows with time under a constant push (power2.in: speed ∝ t).
    speed.current!.textContent = String(Math.round(TOP_SPEED * t)).padStart(3, "0");
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

  const { road: labels } = site.journeyScene;
  return (
    <Scene
      id="estrada"
      heightVh={HEIGHT_VH}
      // see-through while it slides in (the stage paints its own background once pinned)
      background="transparent"
      headerTheme="light"
      from="slide"
      onProgress={onProgress}
      // Over scene 3's last screen: it slides in on top of the same truck.
      className="-mt-[100svh]"
    >
      <div ref={stage} className="absolute inset-0">
        {/* The road, level with the truck's box: its edge at the tyres, the lane dashes below, the red trail. */}
        <div
          ref={road}
          aria-hidden="true"
          className="absolute inset-x-0 top-[54%] h-[calc(90vw*941/1672)] -translate-y-1/2 opacity-0"
        >
          <div className="absolute inset-x-0 h-px bg-navy-900/15" style={{ top: pct(ROAD_Y, TRUCK.height) }} />
          <div
            className="absolute inset-x-0 h-[3px]"
            style={{
              top: `calc(${pct(ROAD_Y, TRUCK.height)} + 28px)`,
              backgroundImage: "linear-gradient(90deg, rgb(10 19 56 / 0.18) 0 48px, transparent 48px 96px)",
              backgroundSize: "96px 3px",
            }}
          />
          <div
            ref={trail}
            className="absolute left-0 h-[3px] w-full origin-right bg-red-500"
            style={{ top: `calc(${pct(ROAD_Y, TRUCK.height)} + 1px)`, transform: "scaleX(0)" }}
          />
        </div>

        <div ref={truck} className={TRUCK_FRAME}>
          <div ref={drive} className="absolute inset-0">
            <SceneImage
              name="carreta-lado-vazia"
              alt={site.journeyScene.truckAlt}
              sizes="(min-width: 768px) 90vw, 250vw"
              full
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0" style={{ clipPath: CONTAINER_CLIP }}>
              <SceneImage name="carreta-lado" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="h-full w-full" />
            </div>
            {WHEELS.map((w) => (
              <div
                key={w.x}
                data-rim=""
                aria-hidden="true"
                className="absolute hidden aspect-square rounded-full"
                style={{
                  left: pct(w.x - RIM_R, TRUCK.width),
                  top: pct(w.y - RIM_R, TRUCK.height),
                  width: pct(2 * RIM_R, TRUCK.width),
                  backgroundImage: `url(${IMG})`,
                  backgroundSize: `${(TRUCK.width / (2 * RIM_R)) * 100}% auto`,
                  backgroundPosition: `${pct(w.x - RIM_R, TRUCK.width - 2 * RIM_R)} ${pct(w.y - RIM_R, TRUCK.height - 2 * RIM_R)}`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Above the container, right-aligned on wide screens: clear of the cab and of the box. */}
        <div ref={copy} className="site-container absolute inset-x-0 top-[13svh] text-navy-900 opacity-0 md:text-right">
          <ContainerCode index={homeCode("estrada")} label={scene.code} />
          <p className="font-condensed mt-3 max-w-[18ch] text-[clamp(2rem,3.4vw,3.25rem)] leading-[0.92] font-bold uppercase md:ml-auto md:max-w-[22ch]">
            {scene.text}
          </p>
          <p className="font-mono-tabular mt-3 text-sm text-navy-900/70">
            {labels.highway} · <span ref={speed}>000</span> {labels.unit}
          </p>
        </div>
      </div>
    </Scene>
  );
}
