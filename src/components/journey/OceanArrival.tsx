"use client";

import { useCallback, useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useQualityTier } from "@/lib/quality";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { ArrivalFrame, type Frame, frames, loadSharp, setRedraw, viewOf } from "./ArrivalFrame";
import { APG_CONTAINERS, BOW, type Rect, SHIP, TARGET, type View, ZOOM, cameraTransform, sampleOceanCamera, toScreen } from "./oceanCamera";
import { edges, guide, place } from "./marks";
import { Scene, segment } from "./Scene";

const scene = site.journey.find((s) => s.id === "chegada")!;
const HEIGHT_VH = 320;
// Phones: ×0.75, but the slide in over the hero (its first screen).
const PHONE = { head: 100, scale: 0.75 };
const TEUS = new Intl.NumberFormat("pt-BR");

// The script (spec §3, revisions 2026-10-30c and 2026-10-31), over the scene's progress (q): the photo stays still,
// the camera zooms (oceanCamera's ZOOM) and over every stretch a layer of its own moves, pinned to the photo. The
// first 100vh slide the scene in over the hero, which shows the same picture (and the same layers).
// 0–20%: the navigation HUD in a corner, its position running to Suape's; the dashed heading drawn on the water
// ahead of the bow, out of the top of the frame.
const HUD_IN = [0, 0.04] as const;
const HUD_RUN = [0, 0.2] as const;
const HUD_OUT = [0.74, 0.8] as const;
const ROUTE_DRAW = [0.02, 0.2] as const;
// 20–45%: the sonar's two rings out of the ship; the heading's label at the bow.
const SONAR = [
  [0.2, 0.36],
  [0.29, 0.45],
] as const;
const HEADING_IN = [0.2, 0.26] as const;
const HEADING_OUT = [0.42, 0.46] as const;
// 45–75%: the APG containers outlined one by one (drawn round), the counter climbing with them, the note on the first.
const OUTLINE_IN = 0.45;
const OUTLINE_STAGGER = 0.045;
const OUTLINE_DRAW = 0.05;
const OUTLINE_OUT = [0.76, 0.82] as const;
const COPY_IN = [0.45, 0.5] as const;
const COUNT = [0.45, 0.72] as const;
const COPY_OUT = [0.76, 0.8] as const;
// 75–100%: the sight closes in on the client's container, from wide to tight, and locks (a snap in and back, spread
// over enough scroll that no 10vh step of it goes by unseen); its card comes in, solid by 0.85.
const TARGET_IN = [0.75, 0.8] as const;
const CLOSE_IN = [0.75, 0.86] as const;
const LOCK = [0.86, 0.99] as const;
// (fully in by 0.85: the close holds from there)
const CARD_IN = [0.8, 0.85] as const;
// The original photo (desktop) crossfades over the 1920 one before the zoom gets close.
const SHARP_IN = [0.12, 0.26] as const;
// Reduced motion: the end state, still: the camera mid-zoom, the HUD, the outlines, the counter and the card.
const REDUCED_Q = 0.6;

// Outlined in this order: first the one the note points at (right of the deck's centre line, so the note sits on
// the water beside the hull), then the target, then outwards.
const ORDER = [2, 3, 1, 4, 0, 5];
const LINE = 2;
// The dark halo around red bars and leaders.
const HALO = 2;
// Outlines sit this far outside each container: on the dark gaps between them, not on the red and navy paint.
const OUTSET = 4;
// The target's corner marks: heavier than the outlines, closing from this far outside its box to 10 px; each arm
// 28% of its shorter side.
const MARK = { line: 2, gap: 10, from: 120, snap: 5, arm: 0.28 };
// The heading's dashes: 8 px long, every 16 px.
const DASH = { length: 8, every: 16, gap: 12 };

const easeOut = (t: number) => 1 - (1 - t) ** 3;
// The HUD's position: degrees and minutes, from the open sea to Suape's.
const { hud } = site.journeyScene;
const minutes = ([d, m]: readonly number[]) => d * 60 + m;
const dm = (total: number) => `${String(Math.floor(total / 60)).padStart(2, "0")}°${String(Math.round(total % 60) % 60).padStart(2, "0")}′`;
const position = (t: number) =>
  `${dm(minutes(hud.from.lat) + (minutes(hud.to.lat) - minutes(hud.from.lat)) * t)}S ${dm(minutes(hud.from.lon) + (minutes(hud.to.lon) - minutes(hud.from.lon)) * t)}W`;

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
  const bow = toScreen(cam, BOW);

  // 0–20%: the HUD (its position running), the heading drawn dash by dash from the bow up and out of the frame.
  frame.hud.group.style.opacity = String(reduced ? 1 : segment(q, ...HUD_IN) * (1 - segment(q, ...HUD_OUT)));
  frame.hud.coords.textContent = position(reduced ? 1 : easeOut(segment(q, ...HUD_RUN)));
  const reach = (reduced ? 1 : segment(q, ...ROUTE_DRAW)) * Math.max(bow.y - DASH.gap, 0);
  frame.route.forEach((dash, i) => {
    const y = bow.y - DASH.gap - DASH.length - i * DASH.every;
    const on = i * DASH.every < reach && y > -DASH.length;
    place(dash, bow.x - 1, y, on ? 1 : 0, on ? 1 : 0);
  });

  // 20–45%: the sonar's rings out of the ship's centre; the heading's label off the bow, a leader to it.
  const ship = toScreen(cam, SHIP);
  frame.sonar.forEach((ring, i) => {
    const t = reduced ? 0 : segment(q, SONAR[i][0], SONAR[i][1]);
    const size = ring.offsetWidth;
    place(ring, ship.x - size / 2, ship.y - size / 2, 0.35 + 1.9 * t, 0.35 + 1.9 * t);
    ring.style.opacity = String(t > 0 && t < 1 ? 0.75 * (1 - t) : 0);
  });
  const h = frame.heading;
  const hw = h.label.offsetWidth;
  const hx = Math.min(Math.max(bow.x + (md ? 96 : 40), 16), view.width - hw - 16);
  // (below the HUD, in the same corner: on a short phone the bow's label would run into it)
  const hy = Math.max(bow.y + 28, header + 8, frame.hud.group.offsetTop + frame.hud.group.offsetHeight + 8);
  place(h.label, hx, hy);
  guide(h, bow.x, bow.y, Math.min(Math.max(bow.x, hx), hx + hw), hy);
  // (held at the top once the bow has gone off it, its leader pointing where the bow went)
  h.group.style.opacity = String(reduced ? 0 : segment(q, ...HEADING_IN) * (1 - segment(q, ...HEADING_OUT)));

  // 45–75%: the outlines, drawn round one after the other; all leave for the close.
  const out = reduced ? 0 : segment(q, ...OUTLINE_OUT);
  ORDER.forEach((i, n) => {
    const o = frame.outlines[i];
    const b = box(APG_CONTAINERS[i]);
    const r = { x: b.x - OUTSET, y: b.y - OUTSET, w: b.w + 2 * OUTSET, h: b.h + 2 * OUTSET };
    const start = OUTLINE_IN + n * OUTLINE_STAGGER;
    const f = reduced ? 1 : segment(q, start, start + OUTLINE_DRAW);
    edges(o.bars, r, LINE, f);
    // the halo: HALO px outside the red, and under it
    edges(o.halos, { x: r.x - HALO, y: r.y - HALO, w: r.w + 2 * HALO, h: r.h + 2 * HALO }, LINE + HALO, f);
    o.group.style.opacity = String(f > 0 ? 1 - out : 0);
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
  c.group.style.opacity = String((reduced ? 1 : segment(q, OUTLINE_IN, OUTLINE_IN + OUTLINE_DRAW)) * (1 - out));

  // 75–100%: the sight closes in from wide to tight and locks (a snap in, and back); then the card.
  const t = box(TARGET);
  const close = reduced ? 1 : easeOut(segment(q, ...CLOSE_IN));
  const gap = MARK.gap + (1 - close) * MARK.from - (reduced ? 0 : MARK.snap * Math.sin(Math.PI * segment(q, ...LOCK)));
  const L = MARK.line;
  const arm = MARK.arm * Math.min(t.w, t.h);
  const [x0, y0, x1, y1] = [t.x - gap, t.y - gap, t.x + t.w + gap, t.y + t.h + gap];
  // The corners, red over their dark halo (HALO px round each arm).
  const corners = (bars: HTMLElement[], o: number) => {
    const [a, l] = [arm + 2 * o, L + 2 * o];
    const [X0, Y0, X1, Y1] = [x0 - o, y0 - o, x1 + o, y1 + o];
    place(bars[0], X0, Y0, a, l);
    place(bars[1], X0, Y0, l, a);
    place(bars[2], X1 - a, Y0, a, l);
    place(bars[3], X1 - l, Y0, l, a);
    place(bars[4], X0, Y1 - l, a, l);
    place(bars[5], X0, Y1 - a, l, a);
    place(bars[6], X1 - a, Y1 - l, a, l);
    place(bars[7], X1 - l, Y1 - a, l, a);
  };
  corners(frame.target.halos, HALO);
  corners(frame.target.bars, 0);
  const card = frame.target.label;
  const tw = card.offsetWidth;
  // beside it, on the right where there is room, else below it
  const right = t.x + t.w + MARK.gap + 12;
  const fits = right + tw <= view.width - 16;
  // beside the sight, a little off it, with a leader from its corner
  const [kx, ky] = fits ? [right + 24, t.y] : [Math.max(16, Math.min(t.x, view.width - tw - 16)), y1 + 32];
  place(card, kx, ky);
  if (fits) guide(frame.target, x1, y0 + 8, kx, ky + card.offsetHeight / 2);
  else guide(frame.target, x0 + 8, y1, kx + 16, ky);
  card.style.opacity = String(reduced ? 1 : segment(q, ...CARD_IN));
  frame.target.group.style.opacity = String(reduced ? 1 : segment(q, ...TARGET_IN));
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
  const count = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const tier = useQualityTier();
  const raw = useRef(0);
  const top = useRef<number | null>(null);

  const apply = useCallback(() => {
    const el = stage.current!;
    // Sliding in over the hero: hold the picture still on screen, as the hero's copy of it is.
    // (the section's top from the scroll trigger; read from the layout only on a first draw or a resize)
    const stageTop = reduced ? 0 : Math.max(top.current ?? el.parentElement!.getBoundingClientRect().top, 0);
    el.style.transform = `translate3d(0, ${(-stageTop).toFixed(1)}px, 0)`;

    const q = reduced ? REDUCED_Q : raw.current;
    const view = viewOf(el);
    for (const frame of frames) draw(frame, q, view, reduced);

    const copyIn = reduced ? 1 : segment(q, ...COPY_IN) * (1 - segment(q, ...COPY_OUT));
    copy.current!.style.opacity = String(copyIn);
    scrim.current!.style.opacity = String(copyIn);
    copy.current!.style.transform = `translate3d(0, ${((1 - copyIn) * 16).toFixed(1)}px, 0)`;
    copy.current!.style.visibility = copyIn <= 0 ? "hidden" : "";
    // the count climbs with the outlines
    count.current!.textContent = TEUS.format(Math.round(site.journeyScene.arrivalTeus * (reduced ? 1 : segment(q, ...COUNT))));
  }, [reduced]);

  const onProgress = useCallback(
    (p: number, t: number) => {
      raw.current = p;
      top.current = t;
      apply();
    },
    [apply],
  );

  useEffect(() => {
    setRedraw(apply);
    apply();
    const observer = new ResizeObserver(() => {
      top.current = null;
      apply();
    });
    observer.observe(stage.current!);
    return () => {
      setRedraw(null);
      observer.disconnect();
    };
  }, [apply]);

  // The original (6688 px) only for the desktop close, fetched as the scene comes near (the phone's close is the
  // 1920 one).
  useEffect(() => {
    // (nor on the 'low' tier: lib/quality)
    if (!window.matchMedia("(min-width: 768px)").matches || tier === "low") return;
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
  }, [tier]);

  return (
    <Scene
      id="chegada"
      heightVh={HEIGHT_VH}
      background="#0d2f4f"
      headerTheme="dark"
      // over the hero's last screen: it slides in on top of the hero's copy of the picture
      from="slide"
      onProgress={onProgress}
      phone={PHONE}
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
            <span className="sr-only">{TEUS.format(site.journeyScene.arrivalTeus)}</span>
            <span ref={count} aria-hidden="true" className="tabular-nums">
              {TEUS.format(site.journeyScene.arrivalTeus)}
            </span>
            <span className="block">{scene.text}</span>
          </p>
        </div>
      </div>
    </Scene>
  );
}
