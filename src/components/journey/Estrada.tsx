"use client";

import { Clock, Container, MapPinned, Radar, Route, Ship, Truck, Warehouse } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, SplitText } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { History } from "@/components/ui/History";
import { Scoreboard } from "@/components/ui/Scoreboard";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { TRUCK } from "./craneAnchors";
import {
  ESTRADA_VH,
  TRUCK_VIEWS,
  type TruckView,
  ESTRADA_HEIGHT_VH,
  ESTRADA_PHONE,
  phasesAt,
  rigCentre,
  roadDistance,
  roadSpeed,
  thetaAt,
  trackPath,
  viewFit,
  viewWeights,
} from "./estradaScript";
import { CONE_AT } from "@/three/stages/distributionCamera";
import { leader } from "./marks";
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

// The rig's centre (side view px): the middle of its footprint seen from above. The camera holds it through B and
// the truck turns about it in C; every view is fitted to the side one (viewFit).
const SIDE = TRUCK_VIEWS.lado;
const TOP = TRUCK_VIEWS.cima;
const O = rigCentre();
// Seen from above: the rig's length (side view px) and its width over its length; the road's width over the rig's.
const TOP_LENGTH = (TOP.rear - TOP.front) * viewFit(TOP).k;
const TOP_WIDTH = (TOP.bottom - TOP.top) / (TOP.rear - TOP.front);
const LANE = 2.4;
const FAR_VIEWS: TruckView[] = [TRUCK_VIEWS.alto30, TRUCK_VIEWS.alto60, TRUCK_VIEWS.cima];
// B's ground: a plane under the truck, seen in perspective (this many lane widths away), tilted by the camera's
// angle: edge on, a line under the tyres, side on; flat, the road, from above.
const PERSPECTIVE = 3;

// The wheels of the side view (Road's, carried on): hubs, the disc's radius on the plain sidewall, the tyres' line.
// (AVIF where the browser takes it: the WebP is twice the bytes)
const IMG = `image-set(url(/images/journey/carreta-lado-vazia-1672.avif) type("image/avif"), url(/images/journey/carreta-lado-vazia-1672.webp) type("image/webp"))`;
const WHEELS = [172, 578, 1216, 1357, 1498].map((x) => ({ x, y: 639 }));
const RIM_R = 54;
const TOP_SPEED = 80;

// A's cards, the services then the differentials, each with its line icon; C's chapters, theirs.
const ICONS = [Container, Route, Warehouse, Truck, Radar, Clock, Ship];
const CHAPTER_ICONS = [Ship, Truck, CraneIcon, Warehouse, MapPinned];
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
  // the rig's centre on screen in TRUCK_FRAME, untransformed
  a0: { x: number; y: number };
  // A's pulled-back scale
  zA: number;
  // the truck's length from above (C, D) and the road's width
  Lc: number;
  lane: number;
  zC: number;
  // where the camera keeps the truck from A's end through C
  c: { x: number; y: number };
  // the chapters' cards: where each one's leader ends on it (stage px)
  cardEnds: { x: number; y: number }[];
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
  const rigEl = useRef<HTMLDivElement>(null);
  const viewsEl = useRef<HTMLDivElement>(null);
  const copyEl = useRef<HTMLDivElement>(null);
  const speedEl = useRef<HTMLSpanElement>(null);
  const bandCopyEl = useRef<HTMLDivElement>(null);
  const cardsEl = useRef<HTMLUListElement>(null);
  const trackTitleEl = useRef<HTMLParagraphElement>(null);
  const boardEl = useRef<HTMLDivElement>(null);
  const nightEl = useRef<HTMLDivElement>(null);
  const coneEl = useRef<HTMLDivElement>(null);
  const planeEl = useRef<HTMLDivElement>(null);
  const planeLaneEl = useRef<HTMLDivElement>(null);
  const planeShadowEl = useRef<HTMLDivElement>(null);
  const pinsEl = useRef<HTMLDivElement>(null);
  const leadersEl = useRef<HTMLDivElement>(null);
  const titleLines = useRef<HTMLElement[][]>([]);
  const trackRef = useRef<SVGPathElement>(null);
  const laneRef = useRef<SVGPathElement>(null);

  const measure = useCallback(() => {
    const el = stage.current!;
    const W = el.clientWidth;
    const H = el.clientHeight;
    const mobile = W < 768;
    const s0 = (0.9 * W) / TRUCK.width;
    const top0 = 0.54 * H - (TRUCK.height * s0) / 2;
    const a0 = { x: 0.05 * W + O.x * s0, y: top0 + O.y * s0 };
    // A pulls back (wide screens), the tyres to 60% of the height, and drifts a little to the left
    const zA = mobile ? 1 : 0.66;
    const c = mobile ? { x: a0.x - 0.04 * W, y: a0.y } : { x: 0.46 * W, y: 0.6 * H - (SIDE.wheel.y - O.y) * s0 * zA };
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
    // the ground plane, the lane's width (its tilt and scale set by apply)
    const plane = planeEl.current!;
    plane.style.width = `${4 * W}px`;
    plane.style.height = `${lane}px`;
    planeShadowEl.current!.style.width = `${1.04 * Lc}px`;
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
      zA,
      zC: Lc / (TOP_LENGTH * s0),
      c,
      cardEnds: [...chaptersEl.current!.querySelectorAll<HTMLElement>("[data-chapter]")].map((card, i) => {
        // the side facing the truck: wide screens, the left edge (right card) or the right (left card), near the
        // top; phones, the bottom edge (top card) or the top (bottom card), near the left
        const box = card.getBoundingClientRect();
        const st = el.getBoundingClientRect();
        const [x, y] = [box.left - st.left, box.top - st.top];
        if (!mobile) return { x: i % 2 ? x + box.width : x, y: y + 28 };
        return { x: x + 40, y: i % 2 ? y : y + box.height };
      }),
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
    // The chapters' pins at the track's edge, on the side of their card.
    pinsEl.current!.querySelectorAll<HTMLElement>("[data-pin]").forEach((pin, i) => {
      const p = pointAt(L, chapters[i]);
      // the edge's normal pointing towards the card: right or left (wide screens), up or down (phones)
      let [nx, ny] = [-Math.sin(p.angle), Math.cos(p.angle)];
      const towards = mobile ? (i % 2 ? ny : -ny) : i % 2 ? -nx : nx;
      if (towards < 0) [nx, ny] = [-nx, -ny];
      const off = lane / 2 + 14;
      pin.dataset.x = String(p.x + nx * off);
      pin.dataset.y = String(p.y + ny * off);
      pin.style.transform = `translate(${(p.x + nx * off).toFixed(1)}px, ${(p.y + ny * off).toFixed(1)}px)`;
    });
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
    const ph = phasesAt(reduced ? 0 : raw.current);
    if (!farRef.current && ph.slide >= 1) {
      farRef.current = true;
      setFar(true);
    }
    const reveal = reduced ? 1 : ph.slide;

    // The road through A and B: its distance (px) and speed.
    const tAB = (ph.a * ESTRADA_VH.a + ph.b * ESTRADA_VH.b) / (ESTRADA_VH.a + ESTRADA_VH.b);
    const dist = roadDistance(tAB) * L.roadTotal;
    const speed = roadSpeed(tAB) * (1 - segment(ph.d, 0, 0.6));

    // The truck: A pulls the camera back a little (wide screens) and drifts left; B holds its centre still while the
    // camera rises (θ, 0° to 90°) and the truck shrinks to its size on the track, smoothly with θ; C keeps it where
    // the camera follows it; D pulls back over the dock.
    const theta = ph.b > 0 ? thetaAt(ph.b) : 0;
    const u = segment(ph.a, 0, 0.12, easeInOut);
    let z = lerp(1, L.zA, u);
    let X = lerp(L.a0.x, L.c.x + 0.04 * W, u) - 0.04 * W * segment(ph.a, 0.12, 1);
    let Y = lerp(L.a0.y, L.c.y, u);
    if (ph.b > 0) {
      z = L.zA * (L.zC / L.zA) ** (theta / 90);
      [X, Y] = [L.c.x, L.c.y];
    }
    // along the track (C, then D easing to the stop)
    const cEnd = L.length - 2.2 * L.Lc;
    const stop = L.length - 0.62 * L.Lc;
    const s = ph.d > 0 ? lerp(cEnd, stop, easeOut(segment(ph.d, 0, 0.6))) : lerp(L.start, cEnd, ph.c);
    const at = pointAt(L, s);
    // E: the camera pulls back further and over to put the dock's door on the terminal's point of the map that
    // scene 5 opens on (CONE_AT), as the ground darkens to navy.
    const kE = easeInOut(segment(ph.e, 0, 0.95));
    const zD = (1 - 0.22 * easeInOut(segment(ph.d, 0, 0.6))) * lerp(1, 0.55, kE);
    const door = pointAt(L, L.length);
    const cone = CONE_AT({ width: W, height: H });
    const dockAt = mobile ? { x: 0.5 * W, y: 0.55 * H } : { x: 0.62 * W, y: 0.4 * H };
    let angle = 0;
    if (ph.c > 0) {
      z = L.zC * zD;
      const k = easeInOut(segment(ph.d, 0, 0.6));
      X = lerp(lerp(L.c.x, dockAt.x, k), cone.x - (door.x - at.x) * zD, kE);
      Y = lerp(lerp(L.c.y, dockAt.y, k), cone.y - (door.y - at.y) * zD, kE);
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
    const front = X - (O.x - SIDE.front) * sz;
    const rear = X + (SIDE.rear - O.x) * sz;

    // The views, crossfading with the angle (viewWeights).
    const weights = viewWeights(theta);
    const views = viewsEl.current!.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < 4; i++) views[i].style.opacity = String(weights[i]);
    // Rolling, not sliding: the wheels turn by the road's distance over the tyre's radius.
    const deg = (-dist / ((SIDE.wheel.y - WHEELS[0].y) * sz)) * (180 / Math.PI);
    for (const rim of viewsEl.current!.querySelectorAll<HTMLElement>("[data-rim]")) {
      rim.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      rim.style.display = dist > 0 && weights[0] > 0 ? "block" : "";
    }

    // B's ground: the plane, tilted to the camera's angle about the road's middle, which sits on the tyres' line side
    // on and under the rig's centre from above; scaled with the truck; the lane's dashes run on it.
    const inC = ph.c > 0;
    const rad = (theta * Math.PI) / 180;
    const planeY = Y + (SIDE.wheel.y - O.y) * sz * Math.cos(rad);
    planeEl.current!.style.transform = `translate3d(${(X - 2 * W).toFixed(1)}px, ${(planeY - L.lane / 2).toFixed(1)}px, 0) scale(${(z / L.zC).toFixed(5)}) perspective(${(PERSPECTIVE * L.lane).toFixed(0)}px) rotateX(${(90 - theta).toFixed(3)}deg)`;
    planeEl.current!.style.opacity = ph.b > 0 && !inC ? "1" : "0";
    planeLaneEl.current!.style.transform = `translate3d(${((dist % 64) - 64).toFixed(1)}px, 0, 0)`;

    // A: the road (its edge at the tyres, the lane's dashes running back, the red trail behind the truck), the
    // word sliding the other way, the copy and the speedometer.
    const roadOut = 1 - segment(theta, 0, 12);
    roadEl.current!.style.transform = `translate3d(0, ${(Y + (SIDE.wheel.y - O.y) * sz).toFixed(1)}px, 0)`;
    roadEl.current!.style.opacity = String(reveal * roadOut);
    dashesEl.current!.style.transform = `translate3d(${((dist % 96) - 96).toFixed(1)}px, 0, 0)`;
    trailAEl.current!.style.transform = `scaleX(${Math.min(Math.max((W - rear) / W, 0), 1).toFixed(4)})`;
    wordEl.current!.style.transform = `translate3d(${(-0.25 * W + 0.3 * dist).toFixed(1)}px, ${(Y - 0.36 * H).toFixed(1)}px, 0)`;
    // (the word only once pinned: across the slide nothing may change round scene 3's truck)
    wordEl.current!.style.opacity = String(segment(ph.a, 0, 0.05) * (1 - segment(theta, 0, 25)));
    // (once pinned: sliding, scene 3's own code still shows under it)
    copyEl.current!.style.opacity = String(segment(ph.a, 0, 0.03) * (1 - segment(theta, 50, 80)));
    speedEl.current!.textContent = String(Math.round(TOP_SPEED * speed)).padStart(3, "0");

    // A's navy band under the road, its title and cards: they go down and out as the camera starts to rise.
    const bandTop = Y + (SIDE.wheel.y - O.y) * sz + (mobile ? 36 : 56);
    const bandOut = segment(theta, 0, 18);
    bandEl.current!.style.transform = `translate3d(0, ${(bandTop + bandOut * 60).toFixed(1)}px, 0) scaleY(${((H - bandTop) / H).toFixed(5)})`;
    bandEl.current!.style.opacity = String(reveal * (1 - bandOut));
    bandCopyEl.current!.style.transform = `translate3d(0, ${(bandTop + bandOut * 60).toFixed(1)}px, 0)`;
    bandCopyEl.current!.style.opacity = String(reveal * (1 - bandOut));
    // The cards: riding the road (wide screens), each revealed as the cab passes it, the first one there from the
    // start (never an empty band); on phones one at a time under the truck, in from the left as the truck reaches
    // it, out to the right for the next.
    const cards = cardsEl.current!.children as HTMLCollectionOf<HTMLElement>;
    for (let i = 0; i < cards.length; i++) {
      const at0 = i * L.spacing;
      if (!mobile) {
        const x = front + dist - at0;
        const k = segment(dist, at0 - 0.25 * L.spacing, at0, easeOut);
        cards[i].style.transform = `translate3d(${x.toFixed(1)}px, ${((1 - k) * 16).toFixed(1)}px, 0)`;
        cards[i].style.opacity = String(k);
      } else {
        const k = segment(dist, at0 - 0.3 * L.spacing, at0, easeOut);
        const out = i < cards.length - 1 ? segment(dist, at0 + 0.7 * L.spacing, at0 + L.spacing) : 0;
        cards[i].style.transform = `translate3d(${((out - (1 - k)) * 40).toFixed(1)}px, 0, 0)`;
        cards[i].style.opacity = String(k * (1 - out));
      }
    }

    // C and D: the world (track, trail, pins, dock) under the camera, which keeps the truck where it is.
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
    // Each chapter as the truck reaches it, until the next one, alternately either side of the truck (wide screens:
    // right of it, then left under the title; phones: above it, then below): its pin on the track lights up and
    // pulses, a leader draws from it to the card, the card comes in (its icon drawing itself, its number counting,
    // its title rising line by line, its bar of chapters filling) and slides out as the next one comes.
    const pins = pinsEl.current!.querySelectorAll<HTMLElement>("[data-pin]");
    const leaders = leadersEl.current!.children as HTMLCollectionOf<HTMLElement>;
    chaptersEl.current!.querySelectorAll<HTMLElement>("[data-chapter]").forEach((ch, i) => {
      const at0 = L.chapters[i];
      const k = inC ? segment(s, at0 - CHAPTER_IN * L.Lc, at0, easeOut) : 0;
      const next = L.chapters[i + 1];
      const out = next !== undefined ? segment(s, next - 1.4 * CHAPTER_IN * L.Lc, next - CHAPTER_IN * L.Lc) : segment(ph.d, 0, 0.15);
      ch.style.opacity = String(k * (1 - out));
      ch.style.transform = `translate3d(${(out * (mobile || i % 2 ? -32 : 32)).toFixed(1)}px, ${((1 - k) * 14).toFixed(1)}px, 0)`;
      // (the attribute only on a change: the icon's strokes draw by a CSS transition)
      const isIn = k > 0.4 && out < 1;
      if (isIn !== ch.hasAttribute("data-in")) ch.toggleAttribute("data-in", isIn);
      const pin = pins[i];
      const lit = inC && s >= at0 - CHAPTER_IN * L.Lc;
      if (lit !== pin.hasAttribute("data-lit")) pin.toggleAttribute("data-lit", lit);
      // the number, counting
      const c = history[i].count;
      if (c) {
        const n = Math.round(lerp(c.from, c.to, easeOut(segment(s, at0 - CHAPTER_IN * L.Lc, at0 + L.Lc))));
        ch.querySelector<HTMLElement>("[data-count]")!.textContent = c.from === 0 ? count.format(n) : String(n);
      }
      // the title's lines out of their masks, one after the other
      titleLines.current[i]?.forEach((line, j) => {
        const t = segment(s, at0 - (CHAPTER_IN - 0.12 * (j + 1)) * L.Lc, at0 + 0.12 * (j + 1) * L.Lc, easeOut);
        line.style.transform = `translate3d(0, ${((1 - t) * 110).toFixed(1)}%, 0)`;
      });
      ch.querySelector<HTMLElement>("[data-bar]")!.style.transform = `scaleX(${k.toFixed(4)})`;
      // the leader, from the pin (world → stage px) to the card, drawn as far as k
      const [ax, ay] = [X + (Number(pin.dataset.x) - at.x) * zw, Y + (Number(pin.dataset.y) - at.y) * zw];
      const end = L.cardEnds[i];
      // (gone once the card is in and the truck drives on: a long line across the track would only clutter it)
      const shown = k * (1 - out) * (1 - segment(s, at0 + 0.6 * L.Lc, at0 + 1.2 * L.Lc));
      leaders[i].style.opacity = String(shown);
      if (shown > 0) leader(leaders[i], ax, ay, lerp(ax, end.x, k), lerp(ay, end.y, k));
    });
    trackTitleEl.current!.style.opacity = String(segment(ph.c, 0, 0.05) * (1 - segment(ph.d, 0, 0.2)));

    // D: the scoreboard, its cells in one after the other, their numbers counting up.
    const board = segment(ph.d, 0.3, 0.45) * (1 - segment(ph.e, 0, 0.3));
    boardEl.current!.style.opacity = String(board);
    boardEl.current!.querySelectorAll<HTMLElement>("[data-cell]").forEach((cell, i) => {
      const k = segment(ph.d, 0.32 + i * 0.05, 0.42 + i * 0.05, easeOut);
      cell.style.opacity = String(k);
      cell.style.transform = `translate3d(0, ${((1 - k) * 12).toFixed(1)}px, 0)`;
      const n = segment(ph.d, 0.35 + i * 0.05, 0.75 + i * 0.05, easeOut);
      cell.querySelector<HTMLElement>("[data-value]")!.textContent = count.format(Math.round(dock.stats[i].value * n));
    });
    // E: night falls over it all but the terminal's red point (scene 5's, on the same pixel).
    nightEl.current!.style.opacity = String(segment(ph.e, 0.1, 0.85));
    coneEl.current!.style.opacity = String(segment(ph.e, 0.4, 1));
    coneEl.current!.style.transform = `translate3d(${cone.x.toFixed(1)}px, ${cone.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      raw.current = p;
      apply();
    },
    [apply],
  );

  // The chapters' titles split into masked lines (raised by apply); their icons' strokes each of length 1, to draw.
  useEffect(() => {
    if (reduced) return;
    const titles = [...chaptersEl.current!.querySelectorAll<HTMLElement>("[data-title]")];
    const splits = titles.map((t) => SplitText.create(t, { type: "lines", mask: "lines" }));
    titleLines.current = splits.map((sp) => sp.lines as HTMLElement[]);
    for (const shape of chaptersEl.current!.querySelectorAll(".chapter-icon *")) shape.setAttribute("pathLength", "1");
    apply();
    return () => {
      for (const sp of splits) sp.revert();
      titleLines.current = [];
    };
  }, [reduced, apply]);

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
      heightVh={ESTRADA_HEIGHT_VH}
      phone={ESTRADA_PHONE}
      // see-through while it slides in (the stage paints its own background once pinned)
      background="transparent"
      headerTheme="light"
      // over scene 3's last screen: it slides in on top of the same truck
      from="slide"
      onProgress={onProgress}
    >
      <div ref={stage} className="absolute inset-0 overflow-hidden">
        {/* The giant word behind the truck, sliding against its run. */}
        <div
          ref={wordEl}
          aria-hidden="true"
          className="font-condensed absolute top-0 left-0 text-[30vw] leading-none font-bold whitespace-nowrap text-[#EDEBE6] uppercase opacity-0 md:text-[22vw]"
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
          <div ref={pinsEl}>
            {history.map((ch) => (
              <div key={ch.title} data-pin="" className="group absolute top-0 left-0">
                <span className="absolute -top-2 -left-2 size-4 rounded-full bg-red-500 opacity-0 group-data-lit:animate-[pin-pulse_1.4s_var(--ease-out)_3]" />
                <span className="absolute -top-2 -left-2 size-4 rounded-full border-2 border-navy-900 bg-[#fefefe] transition-colors duration-200 group-data-lit:border-red-500 group-data-lit:bg-red-500" />
                <span className="absolute top-0 left-3.5 -translate-y-1/2 bg-navy-900 px-1.5 py-0.5 font-mono text-[11px] leading-none whitespace-nowrap text-sand-50 transition-colors duration-200 group-data-lit:bg-red-500">
                  {ch.mark}
                </span>
              </div>
            ))}
          </div>
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

        {/* A's navy band under the road: a plain box (only transform). */}
        <div ref={bandEl} aria-hidden="true" className="absolute inset-x-0 top-0 h-full origin-top bg-navy-900 opacity-0" />
        {/* B's ground: the road as a plane, tilted to the camera's angle; its contact shadow and its lane's dashes on it. */}
        <div ref={planeEl} aria-hidden="true" className="absolute top-0 left-0 overflow-hidden bg-navy-900 opacity-0">
          <div
            ref={planeShadowEl}
            className="absolute top-[24%] left-1/2 h-[52%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(0_0_0/0.35),transparent)]"
          />
          <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2">
            <div
              ref={planeLaneEl}
              className="h-full w-[calc(100%+64px)]"
              style={{ backgroundImage: "linear-gradient(90deg, rgb(243 239 231 / 0.7) 0 32px, transparent 32px 64px)", backgroundSize: "64px 2px" }}
            />
          </div>
        </div>

        {/* The truck, every view in one rig placed by the camera about its anchor. */}
        <div
          ref={rigEl}
          className={TRUCK_FRAME}
          style={{ transformOrigin: `${pct(O.x, TRUCK.width)} ${pct(O.y, TRUCK.height)}` }}
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
                    backgroundImage: IMG,
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
          className="font-condensed absolute top-[30%] left-[4vw] -translate-y-1/2 border border-navy-900/15 bg-sand-50 px-4 py-3 text-[clamp(2.6rem,5vw,5rem)] leading-[0.9] font-bold text-navy-900 uppercase opacity-0 max-md:hidden"
        >
          {trackText.title.map((line, i) => (
            <span key={line} className={`block ${i === 0 ? "text-steel-400" : ""}`}>
              {line}
            </span>
          ))}
        </p>
        <div ref={leadersEl} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {history.map((ch) => (
            <i key={ch.title} className="absolute top-0 left-0 size-px origin-top-left bg-red-500 opacity-0" />
          ))}
        </div>
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
        {/* E: the night over scene 4's last screen and the terminal's red point (scene 5 opens on both). */}
        <div ref={nightEl} aria-hidden="true" className="absolute inset-0 bg-navy-900 opacity-0" />
        <div ref={coneEl} aria-hidden="true" className="suape-dot absolute top-0 left-0 size-3 rounded-full bg-red-500 opacity-0" />
      </div>
    </Scene>
  );
}

// The history's chapters, alternately either side of the truck: on wide screens right of it, then left under the
// track's title; on phones above it, then below. Each with its code (n of 5), the chapters' bar, its line icon, its
// big mark (counted by apply when it is a number), its title (lines raised by apply) and one line.
const pad = (n: number) => String(n).padStart(2, "0");
function Chapters() {
  return history.map((ch, i) => {
    const Icon = CHAPTER_ICONS[i];
    return (
      <article
        key={ch.title}
        data-chapter=""
        className={`absolute opacity-0 max-md:inset-x-4 md:w-[20rem] ${i % 2 ? "max-md:bottom-[5svh] md:bottom-[10svh] md:left-[4vw]" : "max-md:top-[9svh] md:top-[38%] md:right-[4vw]"}`}
      >
        <div className="border border-navy-900/15 bg-[#fefefe] p-4 text-navy-900">
          <div className="flex items-center justify-between gap-4">
            <ContainerCode index={homeCode("estrada")} label={`${pad(i + 1)}/${pad(history.length)}`} />
            <Icon aria-hidden="true" className="chapter-icon size-7 shrink-0 text-red-500" strokeWidth={1.5} />
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1">
            {history.map((other, j) => (
              <span key={other.title} className="h-0.5 flex-1 overflow-hidden bg-navy-900/15">
                <span data-bar={j === i ? "" : undefined} className="block h-full origin-left bg-red-500" style={{ transform: j < i ? "" : "scaleX(0)" }} />
              </span>
            ))}
          </div>
          <p className="font-condensed mt-3 text-[clamp(2.4rem,4vw,3.6rem)] leading-none font-bold uppercase tabular-nums">
            {ch.count ? <span data-count="">{ch.mark}</span> : ch.mark}
          </p>
          <p data-title="" className="mt-2 font-mono text-xs tracking-[0.12em] text-red-500 uppercase">
            {ch.title}
          </p>
          <p className="mt-1.5 text-[0.9375rem] leading-snug text-navy-900/80">{ch.text}</p>
        </div>
      </article>
    );
  });
}

// A crane, in lucide's line style (24 px, round joins): legs, boom, its A-frame, the hoist and a container.
function CraneIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M6 21V8" />
      <path d="M11 21V8" />
      <path d="M2 8h20" />
      <path d="M6 8l2.5-5L11 8" />
      <path d="M18 8v5" />
      <path d="M15.5 13h5v3h-5z" />
      <path d="M3 21h10" />
    </svg>
  );
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
        <History />
        <div className="mt-[10svh]">
          <Scoreboard />
        </div>
      </div>
    </section>
  );
}
