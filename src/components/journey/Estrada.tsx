"use client";

import { Clock, Container, Radar, Route, Ship, Truck, Warehouse } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { TRUCK } from "./craneAnchors";
import { ESTRADA_VH, TRUCK_VIEWS, type TruckView, estradaHeightVh, phasesAt, roadDistance, roadSpeed, trackPath, viewFit } from "./estradaScript";
import { CONTAINER_CLIP, TRUCK_FRAME } from "./Load";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";
import { TruckShadow } from "./TruckShadow";

const scene = site.journey.find((s) => s.id === "estrada")!;
const { road: roadText, track: trackText, history, dock } = site.journeyScene;
const BACKGROUND = "#fefefe";
const count = new Intl.NumberFormat("pt-BR");
const pct = (v: number, of: number) => `${(v / of) * 100}%`;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeInOut = gsap.parseEase("power2.inOut");
const easeOut = gsap.parseEase("power2.out");

// The side view's anchor (truck px): the middle of the rig on the tyres' line. Every placement of the truck is about
// it, and the other views are fitted to it (viewFit).
const SIDE = TRUCK_VIEWS.lado;
const ANCHOR = { x: (SIDE.front + SIDE.rear) / 2, y: SIDE.anchor };
const RIG_LENGTH = SIDE.rear - SIDE.front;
// Seen from above, the rig's width over its length (carreta-cima's footprint), and the road's width over the rig's.
const TOP_WIDTH = 357 / (TRUCK_VIEWS.cima.rear - TRUCK_VIEWS.cima.front);
const LANE = 2.4;
// B: the views swap in turn (side → 30° → 60° → above), each a crossfade over 6% of the phase, the first one while
// the truck is still moving on (the 30° tractor has two axles, the side one one: the eye takes the swap for the turn).
const SWAPS = [0.3, 0.55, 0.8];
const SWAP_HALF = 0.03;
const FAR_VIEWS: TruckView[] = [TRUCK_VIEWS.alto30, TRUCK_VIEWS.alto60, TRUCK_VIEWS.cima];

// The wheels of the side view (Road's, carried on): hubs, the disc's radius on the plain sidewall, the tyres' line.
const IMG = "/images/journey/carreta-lado-vazia-1672.webp";
const WHEELS = [172, 578, 1216, 1357, 1498].map((x) => ({ x, y: 639 }));
const RIM_R = 54;
const TOP_SPEED = 80;

// A's cards, the services then the differentials, each with its line icon.
const ICONS = [Container, Route, Warehouse, Truck, Radar, Clock, Ship];
// The trail's segments (world px) and the chapters' reveal, in truck lengths along the track.
const TRAIL_STEP = 12;
const CHAPTER_IN = 0.5;
// The dock (D): the warehouse in line under the track's end, its docks numbered, in units of 300 to a truck length.
const DOCK_UNIT = 300;
const DOCKS = 28;
const DOCK_PITCH = 150;
const DOCK_AT = 12;

type Layout = {
  W: number;
  H: number;
  mobile: boolean;
  s0: number;
  // the truck's anchor on screen in TRUCK_FRAME, untransformed
  a0: { x: number; y: number };
  // the truck's length from above (C, D) and the road's width
  Lc: number;
  lane: number;
  zC: number;
  // where the camera keeps the truck in C
  c: { x: number; y: number };
  spacing: number;
  roadTotal: number;
  // the track: its samples every 4 px (x, y), its length, where C starts along it
  xs: Float32Array;
  ys: Float32Array;
  length: number;
  start: number;
  chapters: number[];
};

const SAMPLE = 4;
function pointAt(L: Layout, s: number) {
  const f = Math.min(Math.max(s / SAMPLE, 0), L.xs.length - 2);
  const i = Math.floor(f);
  const k = f - i;
  return {
    x: lerp(L.xs[i], L.xs[i + 1], k),
    y: lerp(L.ys[i], L.ys[i + 1], k),
    angle: Math.atan2(L.ys[i + 1] - L.ys[i], L.xs[i + 1] - L.xs[i]),
  };
}

// Scene 4: from the side view on the road to the track seen from above and the CONE terminal's dock.
export function Estrada() {
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);
  const layout = useRef<Layout | null>(null);
  // alto-30, alto-60 and cima: fetched once A starts (set once, not per frame)
  const [far, setFar] = useState(false);
  const farRef = useRef(false);
  const wordEl = useRef<HTMLDivElement>(null);
  const worldEl = useRef<HTMLDivElement>(null);
  const dockEl = useRef<HTMLDivElement>(null);
  const trailEl = useRef<HTMLDivElement>(null);
  const chaptersEl = useRef<HTMLDivElement>(null);
  const roadEl = useRef<HTMLDivElement>(null);
  const dashesEl = useRef<HTMLDivElement>(null);
  const trailAEl = useRef<HTMLDivElement>(null);
  const bandEl = useRef<HTMLDivElement>(null);
  const bandLaneEl = useRef<HTMLDivElement>(null);
  const rigEl = useRef<HTMLDivElement>(null);
  const viewsEl = useRef<HTMLDivElement>(null);
  const copyEl = useRef<HTMLDivElement>(null);
  const speedEl = useRef<HTMLSpanElement>(null);
  const bandCopyEl = useRef<HTMLDivElement>(null);
  const cardsEl = useRef<HTMLUListElement>(null);
  const trackTitleEl = useRef<HTMLParagraphElement>(null);
  const boardEl = useRef<HTMLDivElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const laneRef = useRef<SVGPathElement>(null);

  const measure = useCallback(() => {
    const el = stage.current!;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const mobile = W < 768;
    const s0 = (0.9 * W) / TRUCK.width;
    const top0 = 0.54 * H - (TRUCK.height * s0) / 2;
    const a0 = { x: 0.05 * W + ANCHOR.x * s0, y: top0 + ANCHOR.y * s0 };
    const Lc = mobile ? 0.42 * W : Math.min(0.2 * W, 0.45 * H);
    const lane = LANE * TOP_WIDTH * Lc;
    const { d, start } = trackPath({ width: W, height: H }, Lc, mobile);
    const path = trackRef.current!;
    path.setAttribute("d", d);
    laneRef.current!.setAttribute("d", d);
    path.style.strokeWidth = `${lane}px`;
    const length = path.getTotalLength();
    const n = Math.ceil(length / SAMPLE) + 1;
    const xs = new Float32Array(n);
    const ys = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const p = path.getPointAtLength(Math.min(i * SAMPLE, length));
      xs[i] = p.x;
      ys[i] = p.y;
    }
    const spacing = mobile ? 0.8 * W : 312;
    // the last card reaches the cab by the end of A (two thirds of the road's run through A and B)
    const roadTotal = (7.6 * spacing) / roadDistance(ESTRADA_VH.a / (ESTRADA_VH.a + ESTRADA_VH.b));
    // C runs from its start to a truck's length before the dock (D pulls in); the chapters along it
    const cEnd = length - 2.2 * Lc;
    const chapters = history.map((_, i) => start + ((i + 0.3) / history.length) * (cEnd - start));
    const L: Layout = {
      W,
      H,
      mobile,
      s0,
      a0,
      Lc,
      lane,
      zC: Lc / (RIG_LENGTH * s0),
      c: mobile ? { x: 0.5 * W, y: 0.45 * H } : { x: 0.6 * W, y: 0.5 * H },
      spacing,
      roadTotal,
      xs,
      ys,
      length,
      start,
      chapters,
    };
    layout.current = L;

    // The trail's segments, built for this track (a few hundred thin boxes along it, revealed by opacity).
    const trail = trailEl.current!;
    trail.replaceChildren();
    for (let s = start - Lc / 2; s < length; s += TRAIL_STEP) {
      const p = pointAt(L, s);
      const seg = document.createElement("i");
      seg.className = "absolute top-0 left-0 h-[3px] w-[13px] origin-[0_50%] bg-red-500 opacity-0";
      seg.dataset.s = String(s);
      seg.dataset.base = `translate(${p.x.toFixed(1)}px, ${(p.y - 1.5).toFixed(1)}px) rotate(${p.angle.toFixed(4)}rad)`;
      seg.style.transform = seg.dataset.base;
      trail.append(seg);
    }
    // The dock: under the track's end, one of its doors on the track's line.
    const end = pointAt(L, length);
    dockEl.current!.style.transform = `translate(${end.x.toFixed(1)}px, ${end.y.toFixed(1)}px) scale(${(Lc / DOCK_UNIT).toFixed(4)})`;
  }, []);

  const apply = useCallback(() => {
    const el = stage.current!;
    const L = layout.current;
    if (!L) return;
    const { W, H, mobile, s0 } = L;
    // Sliding in over scene 3: held still on screen, see-through and without its truck (Road's hand-over).
    const stageTop = reduced ? 0 : Math.max(el.parentElement!.getBoundingClientRect().top, 0);
    const sliding = stageTop > 0;
    el.style.transform = sliding ? `translate(0, ${-stageTop}px)` : "";
    el.style.background = sliding ? "" : BACKGROUND;
    rigEl.current!.style.visibility = sliding ? "hidden" : "";
    const ph = phasesAt(reduced ? 0 : raw.current, mobile);
    if (!farRef.current && ph.slide >= 1) {
      farRef.current = true;
      setFar(true);
    }
    const reveal = reduced ? 1 : segment(ph.slide, 0.6, 1);

    // The road through A and B: its distance (px) and speed.
    const tAB = (ph.a * ESTRADA_VH.a + ph.b * ESTRADA_VH.b) / (ESTRADA_VH.a + ESTRADA_VH.b);
    const dist = roadDistance(tAB) * L.roadTotal;
    const speed = roadSpeed(tAB) * (1 - segment(ph.d, 0, 0.6));

    // The truck: A pulls the camera back a little (wide screens), B rises to the top view and down to its size on
    // the track, C keeps it where the camera follows it, D pulls back over the dock.
    const zA = mobile ? 1 : 0.66;
    const yA = mobile ? L.a0.y : 0.56 * H;
    const xA = mobile ? L.a0.x : 0.5 * W;
    const u = segment(ph.a, 0, 0.12, easeInOut);
    const v = easeInOut(ph.b);
    let z = lerp(1, zA, u);
    let X = lerp(L.a0.x, xA, u) - 0.04 * W * segment(ph.a, 0.12, 1);
    let Y = lerp(L.a0.y, yA, u);
    if (ph.b > 0) {
      z = zA * (L.zC / zA) ** v;
      X = lerp(xA - 0.04 * W, L.c.x, v);
      Y = lerp(yA, L.c.y, v);
    }
    // along the track (C, then D easing to the stop)
    const cEnd = L.length - 2.2 * L.Lc;
    const stop = L.length - 0.62 * L.Lc;
    const s = ph.d > 0 ? lerp(cEnd, stop, easeOut(segment(ph.d, 0, 0.6))) : lerp(L.start, cEnd, ph.c);
    const at = pointAt(L, s);
    const zD = 1 - 0.22 * easeInOut(segment(ph.d, 0, 0.6));
    const dockAt = mobile ? { x: 0.5 * W, y: 0.55 * H } : { x: 0.62 * W, y: 0.4 * H };
    let angle = 0;
    if (ph.c > 0) {
      z = L.zC * zD;
      const k = easeInOut(segment(ph.d, 0, 0.6));
      X = lerp(L.c.x, dockAt.x, k);
      Y = lerp(L.c.y, dockAt.y, k);
      // the truck points left (π): it turns to the track's heading
      angle = at.angle - Math.PI;
      if (angle < -Math.PI) angle += 2 * Math.PI;
    }
    const moved = Math.abs(z - 1) > 1e-4 || Math.abs(X - L.a0.x) > 0.05 || Math.abs(Y - L.a0.y) > 0.05 || angle !== 0;
    // at A's start no transform at all: the very pixels of scene 3's truck
    rigEl.current!.style.transform = moved
      ? `translate3d(${(X - L.a0.x).toFixed(2)}px, ${(Y - L.a0.y).toFixed(2)}px, 0) rotate(${angle.toFixed(4)}rad) scale(${z.toFixed(5)})`
      : "";
    const sz = s0 * z;
    const front = X - (ANCHOR.x - SIDE.front) * sz;
    const rear = X + (SIDE.rear - ANCHOR.x) * sz;

    // The views: each crossfades in over the one before, which then goes (one layer composited at a time).
    const w = SWAPS.map((c) => segment(ph.b, c - SWAP_HALF, c + SWAP_HALF));
    const views = viewsEl.current!.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < 4; i++) {
      const on = i === 0 ? 1 : w[i - 1];
      const next = i < 3 ? w[i] : 0;
      views[i].style.opacity = String(next >= 1 ? 0 : on);
    }
    // Rolling, not sliding: the wheels turn by the road's distance over the tyre's radius.
    const deg = (-dist / ((SIDE.anchor - WHEELS[0].y) * sz)) * (180 / Math.PI);
    for (const rim of viewsEl.current!.querySelectorAll<HTMLElement>("[data-rim]")) {
      rim.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      rim.style.display = dist > 0 && ph.b < 0.4 ? "block" : "";
    }

    // A: the road (its edge at the tyres, the lane's dashes running back, the red trail behind the truck), the
    // word sliding the other way, the copy and the speedometer.
    const roadOut = 1 - segment(ph.b, 0, 0.25);
    roadEl.current!.style.transform = `translate3d(0, ${Y.toFixed(1)}px, 0)`;
    roadEl.current!.style.opacity = String(reveal * roadOut);
    dashesEl.current!.style.transform = `translate3d(${((dist % 96) - 96).toFixed(1)}px, 0, 0)`;
    trailAEl.current!.style.transform = `scaleX(${Math.min(Math.max((W - rear) / W, 0), 1).toFixed(4)})`;
    wordEl.current!.style.transform = `translate3d(${(-0.25 * W + 0.3 * dist).toFixed(1)}px, ${(Y - 0.3 * H).toFixed(1)}px, 0)`;
    // (the word only once pinned: across the slide nothing may change round scene 3's truck)
    wordEl.current!.style.opacity = String(segment(ph.a, 0, 0.05) * (1 - segment(ph.b, 0, 0.3)));
    copyEl.current!.style.opacity = String(reveal * (1 - segment(ph.b, 0.6, 0.9)));
    speedEl.current!.textContent = String(Math.round(TOP_SPEED * speed)).padStart(3, "0");

    // The navy band, under the road (A), rises to the road under the truck seen from above (B): its edges eased
    // from A's to the lane's, the lane's dashes drawn on it; C's track takes over on the same pixels.
    const bandTopA = Y + (mobile ? 36 : 56);
    const bb = easeInOut(segment(ph.b, 0, 0.7));
    const bandTop = lerp(bandTopA, L.c.y - L.lane / 2, bb);
    const bandBottom = lerp(H, L.c.y + L.lane / 2, bb);
    const inC = ph.c > 0;
    bandEl.current!.style.transform = `translate3d(0, ${bandTop.toFixed(1)}px, 0) scaleY(${((bandBottom - bandTop) / H).toFixed(5)})`;
    bandEl.current!.style.opacity = String(inC ? 0 : reveal);
    bandLaneEl.current!.style.transform = `translate3d(${((dist % 64) - 64).toFixed(1)}px, ${((bandTop + bandBottom) / 2).toFixed(1)}px, 0)`;
    bandLaneEl.current!.style.opacity = String(inC ? 0 : segment(ph.b, 0.45, 0.7));
    bandCopyEl.current!.style.transform = `translate3d(0, ${bandTop.toFixed(1)}px, 0)`;
    bandCopyEl.current!.style.opacity = String(reveal * (1 - segment(ph.b, 0, 0.2)));
    // The cards: riding the road (wide screens), each revealed as the cab passes it; on phones one at a time under
    // the truck, in from the left as the truck reaches it, out to the right for the next.
    const cards = cardsEl.current!.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < cards.length; i++) {
      const at0 = (i + 1) * L.spacing;
      if (!mobile) {
        const x = front + dist - at0;
        const k = reduced ? 1 : segment(dist, at0 - 0.15 * L.spacing, at0 + 0.1 * L.spacing, easeOut);
        cards[i].style.transform = `translate3d(${x.toFixed(1)}px, ${((1 - k) * 16).toFixed(1)}px, 0)`;
        cards[i].style.opacity = String(k);
      } else {
        const k = segment(dist, at0 - 0.3 * L.spacing, at0, easeOut);
        const out = i < cards.length - 1 ? segment(dist, at0 + 0.7 * L.spacing, at0 + L.spacing) : 0;
        cards[i].style.transform = `translate3d(${((out - (1 - k)) * 40).toFixed(1)}px, 0, 0)`;
        cards[i].style.opacity = String(k * (1 - out));
      }
    }

    // C and D: the world (track, trail, chapters, dock) under the camera, which keeps the truck where it is.
    const zw = inC ? zD : 1;
    worldEl.current!.style.opacity = String(inC ? 1 : 0);
    worldEl.current!.style.transform = `translate3d(${(X - at.x * zw).toFixed(1)}px, ${(Y - at.y * zw).toFixed(1)}px, 0) scale(${zw.toFixed(5)})`;
    const behind = s - 0.5 * L.Lc;
    for (const seg of trailEl.current!.querySelectorAll<HTMLElement>("i")) {
      const f = inC ? Math.min(Math.max((behind - Number(seg.dataset.s)) / TRAIL_STEP, 0), 1) : 0;
      const o = f > 0 ? "1" : "0";
      if (seg.style.opacity !== o) seg.style.opacity = o;
      if (f > 0 && f < 1) seg.style.transform = `${seg.dataset.base} scaleX(${f.toFixed(3)})`;
      else if (f >= 1 && seg.style.transform !== seg.dataset.base) seg.style.transform = seg.dataset.base!;
    }
    // Each chapter as the truck reaches it, until the next one: alternately either side of the truck (wide screens:
    // right of it, then left under the title; phones: above it, then below).
    chaptersEl.current!.querySelectorAll<HTMLElement>("[data-chapter]").forEach((ch, i) => {
      const k = inC ? segment(s, L.chapters[i] - CHAPTER_IN * L.Lc, L.chapters[i], easeOut) : 0;
      const next = L.chapters[i + 1];
      const out = next !== undefined ? segment(s, next - 1.4 * CHAPTER_IN * L.Lc, next - CHAPTER_IN * L.Lc) : segment(ph.d, 0, 0.15);
      const o = k * (1 - out);
      ch.style.opacity = String(o);
      ch.querySelector<HTMLElement>("[data-lift]")!.style.transform = `translate3d(0, ${((1 - k) * 14).toFixed(1)}px, 0)`;
    });
    trackTitleEl.current!.style.opacity = String(segment(ph.c, 0, 0.05) * (1 - segment(ph.d, 0, 0.2)));

    // D: the scoreboard, its cells in one after the other, their numbers counting up.
    const board = segment(ph.d, 0.3, 0.45);
    boardEl.current!.style.opacity = String(board);
    boardEl.current!.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell, i) => {
      const k = segment(ph.d, 0.32 + i * 0.05, 0.42 + i * 0.05, easeOut);
      cell.style.opacity = String(k);
      cell.style.transform = `translate3d(0, ${((1 - k) * 12).toFixed(1)}px, 0)`;
      const n = segment(ph.d, 0.35 + i * 0.05, 0.75 + i * 0.05, easeOut);
      cell.querySelector<HTMLElement>("[data-value]")!.textContent = count.format(Math.round(dock.stats[i].value * n));
    });
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      raw.current = p;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    if (reduced) return;
    const run = () => {
      measure();
      apply();
    };
    run();
    const observer = new ResizeObserver(run);
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [measure, apply, reduced]);

  if (reduced) return <EstradaStill />;

  const sizes = "(min-width: 768px) 60vw, 90vw";
  return (
    <Scene
      id="estrada"
      heightVh={estradaHeightVh(false)}
      phoneHeightVh={estradaHeightVh(true)}
      // see-through while it slides in (the stage paints its own background once pinned)
      background="transparent"
      headerTheme="light"
      from="slide"
      onProgress={onProgress}
      // Over scene 3's last screen: it slides in on top of the same truck.
      className="-mt-[100svh]"
    >
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        {/* The giant word behind the truck, sliding against its run. */}
        <div
          ref={wordEl}
          aria-hidden="true"
          className="font-condensed absolute top-0 left-0 text-[30vw] leading-none font-bold whitespace-nowrap text-transparent uppercase opacity-0 [-webkit-text-stroke:2px_#dcdfe6] md:text-[22vw]"
        >
          {roadText.word}
        </div>

        {/* The world seen from above (C, D): the track, its lane's dashes, the red trail, the dock. */}
        <div ref={worldEl} aria-hidden="true" className="absolute top-0 left-0 origin-top-left opacity-0 will-change-transform">
          <svg className="absolute top-0 left-0 size-px overflow-visible" fill="none">
            <path ref={trackRef} className="stroke-navy-900" strokeLinecap="butt" />
            <path ref={laneRef} className="stroke-sand-50/70" strokeWidth={2} strokeDasharray="32 32" />
          </svg>
          <div ref={dockEl} className="absolute top-0 left-0 origin-top-left">
            <Dock />
          </div>
          <div ref={trailEl} />
        </div>

        {/* A's road, level with the tyres. */}
        <div ref={roadEl} aria-hidden="true" className="absolute inset-x-0 top-0 opacity-0">
          <div className="absolute inset-x-0 top-0 h-px bg-navy-900/15" />
          <div className="absolute top-[22px] -left-24 h-[3px] w-[calc(100%+12rem)] overflow-hidden">
            <div
              ref={dashesEl}
              className="h-full w-full"
              style={{ backgroundImage: "linear-gradient(90deg, rgb(10 19 56 / 0.18) 0 48px, transparent 48px 96px)", backgroundSize: "96px 3px" }}
            />
          </div>
          <div ref={trailAEl} className="absolute top-px left-0 h-[3px] w-full origin-right bg-red-500" style={{ transform: "scaleX(0)" }} />
        </div>

        {/* The navy band under the road: a plain box scaled between its edges (only transform), its lane's dashes. */}
        <div ref={bandEl} aria-hidden="true" className="absolute inset-x-0 top-0 h-full origin-top bg-navy-900 opacity-0" />
        <div ref={bandLaneEl} aria-hidden="true" className="absolute top-0 -left-16 h-0.5 w-[calc(100%+8rem)] opacity-0">
          <div className="h-full w-full" style={{ backgroundImage: "linear-gradient(90deg, rgb(243 239 231 / 0.7) 0 32px, transparent 32px 64px)", backgroundSize: "64px 2px" }} />
        </div>

        {/* The truck, every view in one rig placed by the camera about its anchor. */}
        <div
          ref={rigEl}
          className={TRUCK_FRAME}
          style={{ transformOrigin: `${pct(ANCHOR.x, TRUCK.width)} ${pct(ANCHOR.y, TRUCK.height)}` }}
        >
          <div ref={viewsEl} className="absolute inset-0">
            <div className="absolute inset-0">
              <TruckShadow />
              <SceneImage name="carreta-lado-vazia" alt={site.journeyScene.truckAlt} sizes="(min-width: 768px) 90vw, 250vw" full className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0" style={{ clipPath: CONTAINER_CLIP }}>
                <SceneImage name="carreta-lado" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="h-full w-full" />
              </div>
              {WHEELS.map((wh) => (
                <div
                  key={wh.x}
                  data-rim=""
                  aria-hidden="true"
                  className="absolute hidden aspect-square rounded-full"
                  style={{
                    left: pct(wh.x - RIM_R, TRUCK.width),
                    top: pct(wh.y - RIM_R, TRUCK.height),
                    width: pct(2 * RIM_R, TRUCK.width),
                    backgroundImage: `url(${IMG})`,
                    backgroundSize: `${(TRUCK.width / (2 * RIM_R)) * 100}% auto`,
                    backgroundPosition: `${pct(wh.x - RIM_R, TRUCK.width - 2 * RIM_R)} ${pct(wh.y - RIM_R, TRUCK.height - 2 * RIM_R)}`,
                  }}
                />
              ))}
            </div>
            {FAR_VIEWS.map((view) => {
              const fit = viewFit(view);
              return (
                <div
                  key={view.name}
                  aria-hidden="true"
                  className="absolute opacity-0"
                  style={{
                    left: pct(fit.left, TRUCK.width),
                    top: pct(fit.top, TRUCK.height),
                    width: pct(view.width * fit.k, TRUCK.width),
                    height: pct(view.height * fit.k, TRUCK.height),
                  }}
                >
                  {far && <SceneImage name={view.name} alt="" sizes={sizes} className="h-full w-full" eager />}
                </div>
              );
            })}
          </div>
        </div>

        {/* A: the code and the speedometer, top left. */}
        <div ref={copyEl} className="site-container absolute inset-x-0 top-[13svh] text-navy-900 opacity-0">
          <ContainerCode index={homeCode("estrada")} label={scene.code} />
          <p className="font-mono-tabular mt-2 text-sm text-navy-900/75">
            {roadText.highway} · <span ref={speedEl}>000</span> {roadText.unit}
          </p>
        </div>

        {/* A: the band's title and its cards. */}
        <div ref={bandCopyEl} className="absolute inset-x-0 top-0 text-sand-50 opacity-0">
          <div className="site-container pt-5 md:pt-7">
            <p className="font-condensed text-[clamp(1.6rem,3vw,2.6rem)] leading-none font-bold uppercase">{roadText.title}</p>
          </div>
          <ul ref={cardsEl} className="relative mt-5 h-44 md:mt-6">
            {roadText.cards.map((card, i) => {
              const Icon = ICONS[i];
              return (
                <li
                  key={card.title}
                  className="absolute top-0 left-0 opacity-0 max-md:inset-x-4 max-md:mx-auto max-md:max-w-sm md:w-[17.5rem]"
                >
                  <Icon aria-hidden="true" className="size-6 text-red-500" strokeWidth={1.5} />
                  <p className="mt-3 font-mono text-xs tracking-[0.12em] uppercase">{card.title}</p>
                  <p className="mt-2 text-sm leading-snug text-sand-50/80">{card.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* C: the track's title, fixed at the left (wide screens). */}
        <p
          ref={trackTitleEl}
          className="font-condensed absolute top-[30%] left-[4vw] -translate-y-1/2 rounded-sm bg-[#fefefe]/85 p-3 text-[clamp(2.6rem,5vw,5rem)] backdrop-blur-sm leading-[0.9] font-bold text-navy-900 uppercase opacity-0 max-md:hidden"
        >
          {trackText.title.map((line, i) => (
            <span key={line} className={`block ${i === 0 ? "text-steel-400" : ""}`}>
              {line}
            </span>
          ))}
        </p>
        <div ref={chaptersEl}>
          <Chapters />
        </div>

        {/* D: the terminal's numbers, as a scoreboard. */}
        <div
          ref={boardEl}
          className="absolute opacity-0 max-md:inset-x-4 max-md:top-[12svh] md:bottom-[9svh] md:left-[4vw] md:w-[30rem]"
        >
          <p className="font-mono text-xs tracking-[0.12em] text-navy-900/75 uppercase">{dock.label}</p>
          <dl className="mt-3 grid grid-cols-2 gap-px bg-navy-900/20">
            {dock.stats.map((stat) => (
              <div key={stat.label} data-cell="" className="bg-navy-900 px-4 py-3 text-sand-50 md:px-5 md:py-4">
                <dt className="sr-only">
                  {stat.unit} {stat.label}
                </dt>
                <dd className="font-mono-tabular text-[clamp(1.5rem,3vw,2.4rem)] leading-none font-bold">
                  <span className="sr-only">{count.format(stat.value)}</span>
                  <span data-value="" aria-hidden="true">
                    {count.format(stat.value)}
                  </span>
                  {stat.unit && <span className="ml-1.5 text-sm font-normal">{stat.unit}</span>}
                </dd>
                <dd className="mt-1 font-mono text-xs tracking-[0.1em] text-sand-50/75 uppercase">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Scene>
  );
}

// The history's chapters, alternately either side of the truck: on wide screens right of it, then left under the
// track's title; on phones above it, then below. Frosted, the track runs under them.
function Chapters() {
  return history.map((ch, i) => (
    <article
      key={ch.title}
      data-chapter=""
      className={`absolute opacity-0 max-md:inset-x-4 md:w-[19rem] ${i % 2 ? "max-md:bottom-[6svh] md:bottom-[10svh] md:left-[4vw]" : "max-md:top-[10svh] md:top-1/2 md:right-[4vw] md:-translate-y-1/2"}`}
    >
      <div data-lift="" className="rounded-sm bg-[#fefefe]/90 p-3 backdrop-blur-sm">
        <p className="font-condensed text-[clamp(2rem,3.4vw,3.2rem)] leading-none font-bold text-navy-900 uppercase">{ch.mark}</p>
        <p className="mt-2 font-mono text-xs tracking-[0.12em] text-red-500 uppercase">{ch.title}</p>
        <p className="mt-1.5 text-[0.9375rem] leading-snug text-navy-900/80">{ch.text}</p>
      </div>
    </article>
  ));
}

// D's dock: the CONE terminal's warehouse from above, in line under the track's end, its doors numbered (the truck
// pulls up to DOCK_AT, on the track's line). Units of DOCK_UNIT to a truck length; the track's end at the origin.
function Dock() {
  const width = DOCKS * DOCK_PITCH;
  const x0 = -(DOCK_AT - 0.5) * DOCK_PITCH;
  return (
    <svg className="absolute top-0 left-0 size-px overflow-visible" fill="none">
      <rect x={x0} y={20} width={width} height={1100} className="fill-[#e9e6df] stroke-navy-900/40" strokeWidth={3} />
      <path d={`M${x0} 220H${x0 + width}`} className="stroke-navy-900/20" strokeWidth={2} strokeDasharray="10 14" />
      {Array.from({ length: DOCKS }, (_, i) => {
        const x = x0 + (i + 0.5) * DOCK_PITCH;
        return (
          <g key={i}>
            <rect x={x - 50} y={0} width={100} height={36} className={i === DOCK_AT - 1 ? "fill-red-500" : "fill-navy-900/70"} />
            <text x={x} y={90} textAnchor="middle" className="fill-navy-900 font-mono text-[34px]">
              {String(i + 1).padStart(2, "0")}
            </text>
          </g>
        );
      })}
      <text x={x0 + width / 2} y={620} textAnchor="middle" className="font-condensed fill-navy-900/25 text-[260px] font-bold uppercase">
        {dock.label}
      </text>
    </svg>
  );
}

// Reduced motion: each phase as a still, with every text.
function EstradaStill() {
  return (
    <section id="estrada" data-header-theme="light" className="relative z-10 bg-[#fefefe] text-navy-900">
      <div className="site-container py-[12svh]">
        <ContainerCode index={homeCode("estrada")} label={scene.code} />
        <div className="relative mt-6 aspect-[1672/941] w-full">
          <TruckShadow />
          <SceneImage name="carreta-lado" alt={site.journeyScene.truckAlt} sizes="90vw" className="relative h-full w-full" />
        </div>
      </div>
      <div className="bg-navy-900 py-[10svh] text-sand-50">
        <div className="site-container">
          <p className="font-condensed text-[clamp(1.8rem,4vw,3rem)] leading-none font-bold uppercase">{roadText.title}</p>
          <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {roadText.cards.map((card, i) => {
              const Icon = ICONS[i];
              return (
                <li key={card.title}>
                  <Icon aria-hidden="true" className="size-6 text-red-500" strokeWidth={1.5} />
                  <p className="mt-3 font-mono text-xs tracking-[0.12em] uppercase">{card.title}</p>
                  <p className="mt-2 text-sm leading-snug text-sand-50/80">{card.text}</p>
                </li>
              );
            })}
          </ul>
          <div className="mx-auto mt-[8svh] aspect-[1672/941] w-full max-w-xl">
            <SceneImage name="carreta-cima" alt="" sizes="(min-width: 768px) 36rem, 90vw" className="h-full w-full" />
          </div>
        </div>
      </div>
      <div className="site-container py-[12svh]">
        <p className="font-condensed text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.9] font-bold uppercase">
          {trackText.title.map((line, i) => (
            <span key={line} className={`block ${i === 0 ? "text-steel-400" : ""}`}>
              {line}
            </span>
          ))}
        </p>
        <ol className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {history.map((ch) => (
            <li key={ch.title} className="border-l-2 border-red-500 pl-4">
              <p className="font-condensed text-[clamp(2rem,3.4vw,3rem)] leading-none font-bold uppercase">{ch.mark}</p>
              <p className="mt-2 font-mono text-xs tracking-[0.12em] text-red-500 uppercase">{ch.title}</p>
              <p className="mt-1.5 text-[0.9375rem] leading-snug text-navy-900/80">{ch.text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-[10svh] font-mono text-xs tracking-[0.12em] text-navy-900/75 uppercase">{dock.label}</p>
        <dl className="mt-3 grid grid-cols-2 gap-px bg-navy-900/20 md:grid-cols-4">
          {dock.stats.map((stat) => (
            <div key={stat.label} className="bg-navy-900 px-5 py-4 text-sand-50">
              <dt className="sr-only">
                {stat.unit} {stat.label}
              </dt>
              <dd className="font-mono-tabular text-[clamp(1.5rem,3vw,2.4rem)] leading-none font-bold">
                {count.format(stat.value)}
                {stat.unit && <span className="ml-1.5 text-sm font-normal">{stat.unit}</span>}
              </dd>
              <dd className="mt-1 font-mono text-xs tracking-[0.1em] text-sand-50/75 uppercase">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
