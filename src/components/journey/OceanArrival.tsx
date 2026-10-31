"use client";

import { useCallback, useEffect, useRef } from "react";
import { Counter } from "@/components/motion/Counter";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { ArrivalFrame, type Frame, frames, loadSharp, setRedraw, viewOf } from "./ArrivalFrame";
import { APG_CONTAINERS, BOW, type Rect, TARGET, type View, ZOOM, cameraTransform, sampleOceanCamera, toScreen } from "./oceanCamera";
import { Scene, segment } from "./Scene";

const scene = site.journey.find((s) => s.id === "chegada")!;
const HEIGHT_VH = 320;

// The script (spec §3, revision 2026-10-30c), over the scene's progress (q). The camera zooms from the first pixel
// of scroll (oceanCamera's ZOOM, 0–0.8) and holds the close after; its first 100vh slide the scene in over the
// hero, which shows the same picture.
// a. The heading at the bow, until the bow leaves the screen.
// b. The APG containers outlined one by one, a note on the first, the counter at the left.
const OUTLINE_IN = 0.3;
const OUTLINE_STAGGER = 0.03;
const OUTLINE_FADE = 0.04;
const COPY_IN = [0.34, 0.4] as const;
const COPY_OUT = [0.58, 0.64] as const;
const OUTLINE_OUT = [0.62, 0.68] as const;
// c. The client's container: corner marks and its label, held through the close.
const TARGET_IN = [0.66, 0.74] as const;
// The original photo (desktop) crossfades over the 1920 one before the zoom gets close.
const SHARP_IN = [0.12, 0.26] as const;
// Reduced motion: the camera still in the middle of the zoom, the outlines, their note and the counter shown.
const REDUCED_Q = 0.5;

// Outlined in this order: first the one the note points at (right of the deck's centre line, so the note sits on
// the water beside the hull), then the target, then outwards.
const ORDER = [2, 3, 1, 4, 0, 5];
const LINE = 2;
// The dark halo around red bars and leaders.
const HALO = 2;
// Outlines sit this far outside each container: on the dark gaps between them, not on the red and navy paint.
const OUTSET = 4;
// The target's corner marks: heavier than the outlines, this far outside its box, each arm 28% of its shorter side.
const MARK = { line: 3, gap: 10, arm: 0.28 };

// Where the counter starts: a scroll position inside the scene (the number never scrolls itself, it sits on the
// sticky stage).
const counterStart = () => {
  const el = document.getElementById("chegada")!;
  const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight;
  return top + COPY_IN[0] * el.offsetHeight;
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const place = (el: HTMLElement, x: number, y: number, w = 1, h = 1) =>
  (el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${w.toFixed(2)}, ${h.toFixed(2)})`);
// A line t px thick from a to b, centred on it: a 1 px box rotated and stretched.
const leader = (el: HTMLElement, ax: number, ay: number, bx: number, by: number, t = 1) =>
  (el.style.transform = `translate3d(${ax.toFixed(1)}px, ${ay.toFixed(1)}px, 0) rotate(${Math.atan2(by - ay, bx - ax).toFixed(4)}rad) translate3d(0, ${(-t / 2).toFixed(1)}px, 0) scale(${Math.hypot(bx - ax, by - ay).toFixed(1)}, ${t})`);
// A leader, white over its halo.
const guide = (n: { leader: HTMLElement | null; leaderHalo: HTMLElement | null }, ax: number, ay: number, bx: number, by: number) => {
  leader(n.leaderHalo!, ax, ay, bx, by, 1 + 2 * HALO);
  leader(n.leader!, ax, ay, bx, by);
};
// A rectangle's four edges, t px thick, inside it.
const edges = (bars: HTMLElement[], r: { x: number; y: number; w: number; h: number }, t: number) => {
  const [top, bottom, left, right] = bars;
  place(top, r.x, r.y, r.w, t);
  place(bottom, r.x, r.y + r.h - t, r.w, t);
  place(left, r.x, r.y, t, r.h);
  place(right, r.x + r.w - t, r.y, t, r.h);
};

function draw(frame: Frame, q: number, view: View, reduced: boolean) {
  const cam = sampleOceanCamera(q, view);
  frame.photo.style.transform = cameraTransform(cam);
  frame.sharp.img.style.opacity = frame.sharp.loaded ? String(reduced ? 1 : segment(q, ...SHARP_IN)) : "0";
  const box = (r: Rect) => {
    const a = toScreen(cam, r);
    return { x: a.x, y: a.y, w: r.w * cam.scale, h: r.h * cam.scale };
  };
  const md = view.width >= 768;
  const header = md ? 80 : 64;

  // a. The heading: a label off the bow, a leader from the bow's tip to it; gone as the bow leaves the screen.
  const bow = toScreen(cam, BOW);
  const h = frame.heading;
  const hw = h.label.offsetWidth;
  const hx = Math.min(Math.max(bow.x + (md ? 96 : 40), 16), view.width - hw - 16);
  const hy = Math.max(bow.y + 28, header + 8);
  place(h.label, hx, hy);
  guide(h, bow.x, bow.y, Math.min(Math.max(bow.x, hx), hx + hw), hy);
  h.group.style.opacity = String(reduced ? 0 : clamp01(bow.y / 40));

  // b. The outlines, one at a time; all leave for the close.
  const out = reduced ? 0 : segment(q, ...OUTLINE_OUT);
  ORDER.forEach((i, n) => {
    const o = frame.outlines[i];
    const b = box(APG_CONTAINERS[i]);
    const r = { x: b.x - OUTSET, y: b.y - OUTSET, w: b.w + 2 * OUTSET, h: b.h + 2 * OUTSET };
    edges(o.bars, r, LINE);
    // the halo: HALO px outside the red, and under it
    edges(o.halos, { x: r.x - HALO, y: r.y - HALO, w: r.w + 2 * HALO, h: r.h + 2 * HALO }, LINE + HALO);
    const start = OUTLINE_IN + n * OUTLINE_STAGGER;
    o.group.style.opacity = String((reduced ? 1 : segment(q, start, start + OUTLINE_FADE)) * (1 - out));
  });
  // The note on the first one: beside the hull, a leader from the container's right edge.
  const first = box(APG_CONTAINERS[ORDER[0]]);
  const c = frame.containers;
  const cw = c.label.offsetWidth;
  const ch = c.label.offsetHeight;
  const cx = Math.min(first.x + first.w + (md ? 72 : 24), view.width - cw - 16);
  const cy = first.y + first.h / 2 - ch / 2;
  place(c.label, cx, cy);
  guide(c, first.x + first.w + OUTSET + HALO, first.y + first.h / 2, cx, cy + ch / 2);
  c.group.style.opacity = String((reduced ? 1 : segment(q, OUTLINE_IN, OUTLINE_IN + OUTLINE_FADE)) * (1 - out));

  // c. The client's container: four L-shaped corner marks, like a sight, and its label.
  const t = box(TARGET);
  const { gap, line: L } = MARK;
  const arm = MARK.arm * Math.min(t.w, t.h);
  const [x0, y0, x1, y1] = [t.x - gap, t.y - gap, t.x + t.w + gap, t.y + t.h + gap];
  const m = frame.target.bars;
  place(m[0], x0, y0, arm, L);
  place(m[1], x0, y0, L, arm);
  place(m[2], x1 - arm, y0, arm, L);
  place(m[3], x1 - L, y0, L, arm);
  place(m[4], x0, y1 - L, arm, L);
  place(m[5], x0, y1 - arm, L, arm);
  place(m[6], x1 - arm, y1 - L, arm, L);
  place(m[7], x1 - L, y1 - arm, L, arm);
  const tw = frame.target.label.offsetWidth;
  place(frame.target.label, Math.min(x1 + 12, view.width - tw - 16), y0);
  frame.target.group.style.opacity = String(reduced ? 0 : segment(q, ...TARGET_IN));
  // held at the close: the sight pulses (CSS, off with reduced motion)
  const held = !reduced && q >= ZOOM[1];
  if (held !== (frame.target.group.dataset.held === "")) frame.target.group.toggleAttribute("data-held", held);
}

// Scene 1 (spec §3): one still photo of the ship at sea; only the camera moves, coming down to find the APG
// container: the ship's heading to Suape, the APG containers on the deck, then the client's container.
export function OceanArrival() {
  const stage = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);

  const apply = useCallback(() => {
    const el = stage.current!;
    // Sliding in over the hero: hold the picture still on screen, as the hero's copy of it is.
    const stageTop = reduced ? 0 : Math.max(el.parentElement!.getBoundingClientRect().top, 0);
    el.style.transform = `translate3d(0, ${(-stageTop).toFixed(1)}px, 0)`;

    const q = reduced ? REDUCED_Q : raw.current;
    const view = viewOf(el);
    for (const frame of frames) draw(frame, q, view, reduced);

    const copyIn = reduced ? 1 : segment(q, ...COPY_IN) * (1 - segment(q, ...COPY_OUT));
    copy.current!.style.opacity = String(copyIn);
    scrim.current!.style.opacity = String(copyIn);
    copy.current!.style.transform = `translate3d(0, ${((1 - copyIn) * 16).toFixed(1)}px, 0)`;
    copy.current!.style.visibility = copyIn <= 0 ? "hidden" : "";
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      raw.current = p;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    setRedraw(apply);
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage.current!);
    return () => {
      setRedraw(null);
      observer.disconnect();
    };
  }, [apply]);

  // The original (6688 px) only for the desktop close, fetched as the scene comes near (the phone's close is the
  // 1920 one).
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadSharp();
        io.disconnect();
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(document.getElementById("chegada")!);
    return () => io.disconnect();
  }, []);

  return (
    <Scene
      id="chegada"
      heightVh={HEIGHT_VH}
      background="#0d2f4f"
      headerTheme="dark"
      from="slide"
      onProgress={onProgress}
      // Over the hero's last screen: it slides in on top of the hero's copy of the picture.
      className="-mt-[100svh]"
    >
      <div ref={stage} className="absolute inset-0">
        <ArrivalFrame alt={site.journeyScene.shipAlt} />
      </div>

      {/* Enough navy at the left for the copy to read over the deck. */}
      <div
        ref={scrim}
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[45%] bg-linear-to-r from-navy-900/60 to-transparent opacity-0 max-md:hidden"
      />

      <div
        ref={copy}
        className="site-container absolute inset-x-0 bottom-[6svh] text-sand-50 opacity-0 md:top-[34svh] md:bottom-auto"
      >
        <div className="max-w-[24rem] max-md:rounded-sm max-md:bg-navy-900/70 max-md:p-4 max-md:backdrop-blur-sm">
          <ContainerCode index={homeCode("chegada")} label={scene.code} />
          <p className="font-condensed mt-4 text-[clamp(2.5rem,6vw,5rem)] leading-[0.92] font-bold uppercase">
            <Counter value={site.journeyScene.arrivalTeus} start={counterStart} className="tabular-nums" />
            <span className="block">{scene.text}</span>
          </p>
        </div>
      </div>
    </Scene>
  );
}
