"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/components/motion/gsap";
import { Counter } from "@/components/motion/Counter";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { site } from "@/content/site";
import { SHIP_SOURCE, type ShipBox, createFoam } from "./foam";
import { Ocean, oceanTransform } from "./Ocean";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";

const scene = site.journey.find((s) => s.id === "chegada")!;
const HEIGHT_VH = 260;

// Scene progress runs from the moment it starts sliding in over the hero (its first 100vh of 260 are the slide).
const SLIDE_END = 100 / HEIGHT_VH;
// The ship rises from below the frame into the upper third, then holds while the copy is read.
const RISE = [0.2, 0.62] as const;
const COPY_IN = [0.6, 0.68] as const;
const LINE_IN = [0.45, 0.6] as const;
// Water past the ship while it holds (ship lengths per second): the camera follows it, so the water flows down.
const CRUISE = 0.12;
// The gentle roll: ±0.6° over 7 s.
const SWAY = { deg: 0.6, period: 7 };

const riseEase = gsap.parseEase("power3.out");

// The counter starts when the copy comes in: a scroll position inside the scene (the number never scrolls itself,
// it sits on the sticky stage).
const counterStart = () => {
  const el = document.getElementById("chegada")!;
  const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight;
  return top + COPY_IN[0] * el.offsetHeight;
};

// Scene 1 (spec §3): the ship, seen from above, comes up the screen to Suape with foam at its bow and its wake
// behind; a red dashed heading runs ahead of it to "SUAPE · PE".
export function OceanArrival() {
  const ocean = useRef<HTMLDivElement>(null);
  const oceanInner = useRef<HTMLDivElement>(null);
  const ship = useRef<HTMLDivElement>(null);
  const hull = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const line = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // What the foam loop reads: the ship's layout box (at rest), its current rise offset, and where it was.
  const state = useRef({ box: null as ShipBox | null, shipY: 0, prevY: 0, active: false });

  const onProgress = useCallback((p: number) => {
    // Sliding in over the hero: hold the ocean still on screen, so it is the hero's ocean, seamlessly.
    const stageTop = Math.max(ocean.current!.parentElement!.getBoundingClientRect().top, 0);
    ocean.current!.style.transform = `translate3d(0, ${(-stageTop).toFixed(1)}px, 0)`;
    // Only settles once the slide is over: until then it must stay the hero's exact picture.
    oceanInner.current!.style.transform = oceanTransform(segment(p, SLIDE_END, 1));

    // From just below the frame up to its rest.
    const rise = 1 - riseEase(segment(p, ...RISE));
    const shipY = rise * window.innerHeight;
    state.current.shipY = shipY;
    ship.current!.style.transform = `translate3d(0, ${shipY.toFixed(1)}px, 0)`;

    const lineIn = segment(p, ...LINE_IN);
    line.current!.style.opacity = String(lineIn);
    heading.current!.style.opacity = String(lineIn);
    // The dashed line hangs from the label down to the bow: a tall strip whose bottom rides on the bow.
    const box = state.current.box;
    if (box) {
      const bowY = box.top + (SHIP_SOURCE.bow.y / SHIP_SOURCE.h) * box.height + shipY;
      const lineTop = line.current!.parentElement!.offsetTop;
      line.current!.style.transform = `translate3d(0, ${(bowY - lineTop - window.innerHeight * 2).toFixed(1)}px, 0)`;
    }

    const copyIn = segment(p, ...COPY_IN);
    copy.current!.style.opacity = String(copyIn);
    scrim.current!.style.opacity = String(copyIn);
    copy.current!.style.transform = `translate3d(0, ${((1 - copyIn) * 16).toFixed(1)}px, 0)`;
  }, []);

  // The ship's box at rest, for the foam and the heading line.
  useEffect(() => {
    const measure = () => {
      const el = ship.current!;
      // offsetLeft ignores the -50% translate that centers it.
      state.current.box = { left: el.offsetLeft - el.offsetWidth / 2, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
      const c = canvas.current!;
      const dpr = Math.min(window.devicePixelRatio, 2);
      c.width = c.clientWidth * dpr;
      c.height = c.clientHeight * dpr;
      c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(ship.current!.parentElement!);
    return () => observer.disconnect();
  }, []);

  // The foam and the roll: a frame loop only while the scene is on screen, and never with reduced motion.
  useEffect(() => {
    if (reduced) return;
    const section = document.getElementById("chegada")!;
    const io = new IntersectionObserver(([entry]) => (state.current.active = entry.isIntersecting));
    io.observe(section);
    const ctx = canvas.current!.getContext("2d")!;
    const foam = createFoam();
    // A soft round sprite: blurred at the edge, so a particle is a fleck of foam, not a dot.
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const s = sprite.getContext("2d")!;
    const gradient = s.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    s.fillStyle = gradient;
    s.fillRect(0, 0, 32, 32);

    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      // Frame-rate independent up to 4 fps; past that (a tab coming back) it just resumes.
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      const st = state.current;
      if (!st.active || !st.box) return;
      hull.current!.style.transform = `rotate(${(SWAY.deg * Math.sin((2 * Math.PI * now) / 1000 / SWAY.period)).toFixed(3)}deg)`;
      // The ship on screen: moving up while it rises (the water still), steady once it holds (the water flowing).
      const shipVelocity = dt > 0 ? (st.shipY - st.prevY) / dt : 0;
      st.prevY = st.shipY;
      const cruise = CRUISE * st.box.height;
      const speed = Math.max(cruise, -shipVelocity);
      const flow = Math.max(cruise + shipVelocity, 0);
      const box = { ...st.box, top: st.box.top + st.shipY };
      // Nothing to throw before the ship is in the frame.
      foam.step(dt, box, speed, flow, box.top < window.innerHeight);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (const p of foam.particles) {
        if (p.alpha <= 0.005) continue;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
    };
  }, [reduced]);

  return (
    <Scene
      id="chegada"
      heightVh={HEIGHT_VH}
      background="#0d2f4f"
      headerTheme="dark"
      from="slide"
      onProgress={onProgress}
      // Over the hero's last screen: it slides in on top of the hero's ocean.
      className="z-10 -mt-[100svh]"
    >
      <div ref={ocean} aria-hidden="true" className="absolute inset-0">
        <div ref={oceanInner} className="absolute inset-0" style={{ transform: oceanTransform(reduced ? 1 : 0) }}>
          <Ocean />
        </div>
      </div>

      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      {/* Enough navy at the left for the copy to read over bright water. */}
      <div
        ref={scrim}
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[55%] bg-linear-to-r from-navy-900/45 to-transparent max-md:hidden"
        style={reduced ? undefined : { opacity: 0 }}
      />

      {/* The heading: a red dashed line from "SUAPE · PE" down to the bow. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[13svh] bottom-0 overflow-hidden">
        <div
          ref={line}
          className="absolute top-0 left-1/2 h-[200vh] w-[3px] -translate-x-1/2 opacity-0 max-md:left-1/2 md:left-[62%]"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, #e31e24 0 10px, transparent 10px 20px)" }}
        />
      </div>
      <div
        ref={heading}
        aria-hidden="true"
        className="absolute top-[9svh] left-1/2 -translate-x-1/2 font-mono text-[11px] tracking-[0.18em] whitespace-nowrap text-sand-50 opacity-0 md:left-[62%]"
        style={reduced ? { opacity: 1 } : undefined}
      >
        {site.journeyScene.mapLabels.suape}
      </div>

      <div
        ref={ship}
        className="absolute top-[16svh] left-1/2 aspect-[941/1672] h-[70svh] -translate-x-1/2 md:left-[62%] md:h-[80svh]"
        style={{ transform: reduced ? undefined : `translate3d(0, 100vh, 0)` }}
      >
        <div ref={hull} className="h-full w-full">
          <SceneImage
            name="navio-cima"
            alt={site.journeyScene.shipAlt}
            sizes="(min-width: 768px) 45svh, 40svh"
            // A soft shadow on the water: the hull sits in the sea instead of on it (static: painted once).
            className="h-full w-full drop-shadow-[0_0_22px_rgb(2_12_28/0.55)]"
            eager
          />
        </div>
      </div>

      <div
        ref={copy}
        className="site-container absolute inset-x-0 bottom-[8svh] text-sand-50 md:top-[34svh] md:bottom-auto"
        style={reduced ? undefined : { opacity: 0 }}
      >
        <div className="max-w-[24rem] max-md:rounded-sm max-md:bg-navy-900/55 max-md:p-4 max-md:backdrop-blur-sm">
          <ContainerCode index={2} label={scene.code} />
          <p className="font-condensed mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold uppercase">
            <Counter value={site.journeyScene.arrivalTeus} start={counterStart} className="tabular-nums" />
            <span className="block">{scene.text}</span>
          </p>
        </div>
      </div>
    </Scene>
  );
}
