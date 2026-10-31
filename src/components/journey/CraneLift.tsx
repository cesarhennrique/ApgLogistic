"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap, SplitText } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { viewOf } from "./ArrivalFrame";
import { BOOM_TOP, CRANE, GROUND, HOIST, ROPES, ROPE_WIDTH, SPREADER, SPREADER_BOX } from "./craneAnchors";
import { CONTAINER, HANDOFF_GAP, PX_PER_M, TRUCK_IN_CRANE, sampleCraneCamera, seatDrop } from "./craneCamera";
import { guide, place } from "./marks";
import { type Camera, cameraTransform } from "./oceanCamera";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";
import { TruckShadow } from "./TruckShadow";

const scene = site.journey.find((s) => s.id === "porteiner")!;
const { crane: copyText } = site.journeyScene;
// 360vh: 260 of scroll; scene 3 slides in over its last 100vh (the same truck, the same container), so the script
// runs over the first 160vh (its progress, c) and the close holds under the slide.
const HEIGHT_VH = 360;
const SCRIPT_END = 160 / (HEIGHT_VH - 100);

// The script (spec §3, revision 2026-10-31), over c: it opens wide on the whole crane, the APG container up at the
// trolley; the container comes down (the ropes paying out) while the camera zooms in after it (craneCamera), to a
// close on the truck waiting under the spreader, the container just above it: where scene 3 takes over.
const ZOOM = [0.04, 0.92] as const;
// The descent runs on past the script, through the hold under scene 3's slide (over the scene's raw progress, from
// the script's 4%), never stopping: it reaches HANDOFF_GAP above the seat still moving, as scene 3 pins and sets the
// container down within its first steps. Its ease is power1.inOut cut at 90%, so it ends on the move.
const DESCENT_START = 0.04 * SCRIPT_END;
const descentEase = gsap.parseEase("power1.inOut");
const descent = (u: number) => descentEase(0.9 * u) / descentEase(0.9);
// The callouts, each in as its part shows, out as the camera leaves it.
const CALLOUTS = {
  trolley: { in: [0.02, 0.08], out: [0.3, 0.36] },
  spreader: { in: [0.12, 0.18], out: [0.55, 0.6] },
  container: { in: [0.22, 0.28], out: [0.78, 0.84] },
} as const;
// The dimensions: the crane's height on the wide shot; the container's height above its seat, all the way down.
const CRANE_COTA = { in: [0, 0.05], out: [0.22, 0.3] } as const;
const DROP_COTA_IN = [0.08, 0.14] as const;
// The copy, in halfway down (its lines rising out of their masks), its numbers counting; out before the close.
const TITLE_IN = [0.42, 0.55] as const;
const COUNT = [0.5, 0.65] as const;
const COPY_OUT = [0.8, 0.86] as const;
// Depth of field, over the zoom's progress: from 60% of it the crane crossfades to an out-of-focus copy of itself
// (8 px of blur on screen at the end) and the set (crane, quay, ruler, word) fades to 25%, leaving the truck,
// the container and the spreader sharp.
const DOF = [0.6, 0.9] as const;
const DOF_BLUR = 8;
// The crane, the quay and the word leave the close to the truck and the container (scene 3's picture).
const SET_OUT = [0.9, 1] as const;
// Reduced motion: halfway down, everything shown.
const REDUCED_C = 0.6;

// The quay's edge and the ruler's step.
const QUAY_X = 1500;
const RULER_STEP_M = 5;
const RULER_TICKS = Math.floor((CRANE.width - QUAY_X) / (RULER_STEP_M * PX_PER_M)) + 1;
// confirmar com cliente: the crane's height, from the photo's scale (ground to the top of the boom, ≈ 55 m)
const CRANE_HEIGHT_M = Math.round((GROUND.y - BOOM_TOP) / PX_PER_M / 5) * 5;
const metres = (m: number) => `${m.toFixed(1).replace(".", ",")} m`;
const count = new Intl.NumberFormat("pt-BR");

const base = (w: number, ext: string) => `/images/journey/porteiner-base-${w}.${ext}`;

type Note = { group: HTMLElement; leader: HTMLElement; leaderHalo: HTMLElement; label: HTMLElement };
const noteOf = (el: Element): Note => ({
  group: el as HTMLElement,
  leader: el.querySelector<HTMLElement>("[data-leader]")!,
  leaderHalo: el.querySelector<HTMLElement>("[data-halo]")!,
  label: el.querySelector<HTMLElement>("[data-label]")!,
});

// Scene 2: the APG container lowered from the gantry crane's trolley to the truck waiting on the quay.
export function CraneLift() {
  const stage = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const marks = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLParagraphElement>(null);
  const sharp = useRef<HTMLImageElement>(null);
  const reduced = useReducedMotion();
  const raw = useRef(0);
  const lines = useRef<HTMLElement[]>([]);
  // The moving parts, gathered on the first draw (the scene may draw before this mounts).
  const parts = useRef<{
    load: HTMLElement;
    ropes: HTMLElement[];
    fade: HTMLElement[];
    notes: Record<keyof typeof CALLOUTS, Note>;
    ground: HTMLElement;
    blurred: HTMLElement;
    ticks: HTMLElement[];
    tickLabels: HTMLElement[];
    craneCota: HTMLElement[];
    dropCota: HTMLElement[];
    stats: HTMLElement[];
  } | null>(null);
  // decode() first, so it shows only once it can paint
  const showSharp = () => void sharp.current?.decode().then(() => sharp.current && (sharp.current.style.opacity = "1"), () => {});

  const apply = useCallback(() => {
    const w = world.current!;
    const m = marks.current!;
    parts.current ??= {
      load: w.querySelector<HTMLElement>("[data-load]")!,
      ropes: [...w.querySelectorAll<HTMLElement>("[data-rope]")],
      fade: [...stage.current!.querySelectorAll<HTMLElement>("[data-set]")],
      notes: {
        trolley: noteOf(m.querySelector("[data-callout=trolley]")!),
        spreader: noteOf(m.querySelector("[data-callout=spreader]")!),
        container: noteOf(m.querySelector("[data-callout=container]")!),
      },
      ground: m.querySelector<HTMLElement>("[data-ground]")!,
      blurred: w.querySelector<HTMLElement>("[data-blurred]")!,
      ticks: [...m.querySelectorAll<HTMLElement>("[data-tick]")],
      tickLabels: [...m.querySelectorAll<HTMLElement>("[data-tick-label]")],
      craneCota: [...m.querySelectorAll<HTMLElement>("[data-crane-cota] > *")],
      dropCota: [...m.querySelectorAll<HTMLElement>("[data-drop-cota] > *")],
      stats: [...copy.current!.querySelectorAll<HTMLElement>("[data-stat]")],
    };
    const P = parts.current;
    const p = reduced ? REDUCED_C * SCRIPT_END : raw.current;
    const c = Math.min(p / SCRIPT_END, 1);
    const view = viewOf(stage.current!);
    const cam: Camera = sampleCraneCamera(segment(c, ...ZOOM), view);
    w.style.transform = cameraTransform(cam);
    const sx = (x: number) => cam.x + cam.scale * x;
    const sy = (y: number) => cam.y + cam.scale * y;

    // The load comes down (crane px), the ropes paying out with it.
    // down to HANDOFF_GAP above its seat on the truck: scene 3 finishes the drop
    const dy = descent(segment(p, DESCENT_START, 1)) * (seatDrop - HANDOFF_GAP);
    P.load.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
    ROPES.forEach((r, i) => (P.ropes[i].style.transform = `scaleY(${(SPREADER_BOX.y - r.top + dy).toFixed(1)})`));

    // The set (crane, quay, word) goes out of focus, then leaves the close to the truck and the container. The
    // blur never changes (a varying filter repaints every frame): the crane crossfades, by opacity alone, to a copy
    // blurred once by a fixed amount (in its own px, 8 px on screen at the zoom where the blur ends).
    const dof = reduced ? 0 : segment(segment(c, ...ZOOM), ...DOF);
    const out = 1 - (reduced ? 0 : segment(c, ...SET_OUT));
    const set = out * (1 - 0.75 * dof);
    for (const el of P.fade) el.style.opacity = String(el.dataset.sharp === undefined ? set : out * (1 - dof));
    P.blurred.style.opacity = String(out * 0.25 * dof);
    P.blurred.style.filter = `blur(${(DOF_BLUR / sampleCraneCamera(DOF[1], view).scale).toFixed(1)}px)`;
    word.current!.style.transform = `translate3d(${((0.18 - 0.5 * c) * view.width).toFixed(1)}px, 0, 0)`;

    // The quay: its line under the legs, a ruler along it every 5 m (from the quay's edge).
    const gy = sy(GROUND.y);
    place(P.ground, sx(QUAY_X), gy, sx(CRANE.width) - sx(QUAY_X), 1);
    P.ground.style.opacity = String(set);
    P.ticks.forEach((t, i) => place(t, sx(QUAY_X + i * RULER_STEP_M * PX_PER_M), gy, 1, i % 2 ? 6 : 10));
    P.tickLabels.forEach((l, i) => place(l, sx(QUAY_X + i * 2 * RULER_STEP_M * PX_PER_M) + 4, gy + 10));

    // The crane's height: a red dimension from the ground to the top of the boom, right of the crane.
    const [cLine, cTop, cBottom, cLabel] = P.craneCota;
    const cx = sx(CRANE.width) - 18;
    const [top, bottom] = [sy(BOOM_TOP), gy];
    place(cLine, cx, top, 1.5, bottom - top);
    place(cTop, cx - 6, top, 13, 1.5);
    place(cBottom, cx - 6, bottom - 1.5, 13, 1.5);
    place(cLabel, cx - cLabel.offsetWidth - 10, (top + bottom) / 2 - cLabel.offsetHeight / 2);
    cLine.parentElement!.style.opacity = String(reduced ? 1 : segment(c, ...CRANE_COTA.in) * (1 - segment(c, ...CRANE_COTA.out)));

    // The container's height above its seat on the truck, metres counting down, beside it.
    const [dLine, dTop, dBottom, dLabel] = P.dropCota;
    const boxBottom = sy(CONTAINER.top + CONTAINER.h + dy);
    const seat = sy(CONTAINER.top + seatDrop + CONTAINER.h);
    const dx = sx(CONTAINER.x + CONTAINER.w) + 14;
    place(dLine, dx, boxBottom, 1.5, Math.max(seat - boxBottom, 0));
    place(dTop, dx - 6, boxBottom, 13, 1.5);
    place(dBottom, dx - 6, seat - 1.5, 13, 1.5);
    dLabel.textContent = metres((seatDrop - dy) / PX_PER_M);
    place(dLabel, dx + 10, (boxBottom + seat) / 2 - dLabel.offsetHeight / 2);
    dLine.parentElement!.style.opacity = String(reduced ? 1 : segment(c, ...DROP_COTA_IN));

    // The callouts: a leader from the part to its label (left of it, clear of the legs).
    const callout = (n: Note, key: keyof typeof CALLOUTS, ax: number, ay: number) => {
      const lw = n.label.offsetWidth;
      const lh = n.label.offsetHeight;
      const lx = Math.max(ax - lw - 70, 16);
      const ly = Math.min(Math.max(ay - 46, 96), view.height - lh - 16);
      place(n.label, lx, ly);
      guide(n, ax, ay, lx + lw, ly + lh / 2);
      const k = CALLOUTS[key];
      // phones: out before the copy comes in over them
      const out = view.width < 768 ? [Math.min(k.out[0], TITLE_IN[0] - 0.06), Math.min(k.out[1], TITLE_IN[0])] : k.out;
      n.group.style.opacity = String(reduced ? 1 : segment(c, k.in[0], k.in[1]) * (1 - segment(c, out[0], out[1])));
    };
    callout(P.notes.trolley, "trolley", sx(HOIST.x - 120), sy(HOIST.y - 20));
    callout(P.notes.spreader, "spreader", sx(SPREADER.x + 30), sy(SPREADER.top + 40 + dy));
    callout(P.notes.container, "container", sx(CONTAINER.x), sy(CONTAINER.top + CONTAINER.h / 2 + dy));

    // The copy: its lines out of their masks, one after the other; its numbers counting.
    const lineIn = (i: number) => (reduced ? 1 : segment(c, TITLE_IN[0] + i * 0.03, TITLE_IN[1] + i * 0.03));
    lines.current.forEach((l, i) => (l.style.transform = `translate3d(0, ${((1 - lineIn(i)) * 110).toFixed(1)}%, 0)`));
    const n = reduced ? 1 : segment(c, ...COUNT);
    P.stats.forEach((s, i) => (s.textContent = count.format(Math.round(copyText.stats[i].value * n))));
    const copyOut = reduced ? 0 : segment(c, ...COPY_OUT);
    copy.current!.style.opacity = String((reduced ? 1 : segment(c, TITLE_IN[0], TITLE_IN[0] + 0.04)) * (1 - copyOut));
  }, [reduced]);

  const onProgress = useCallback(
    (p: number) => {
      raw.current = p;
      apply();
    },
    [apply],
  );

  // The line split into masked lines (SplitText), raised by the script.
  useEffect(() => {
    if (reduced) return;
    const split = SplitText.create(title.current!, { type: "lines", mask: "lines" });
    lines.current = split.lines as HTMLElement[];
    apply();
    return () => {
      split.revert();
      lines.current = [];
    };
  }, [reduced, apply]);

  // Loaded before hydration: onLoad never fires.
  useEffect(() => {
    if (sharp.current?.complete && sharp.current.naturalWidth) showSharp();
  });

  useEffect(() => {
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(stage.current!);
    return () => observer.disconnect();
  }, [apply]);

  const { callouts, stats } = copyText;
  return (
    <Scene id="porteiner" heightVh={HEIGHT_VH} background="#fefefe" headerTheme="light" onProgress={onProgress}>
      <div ref={stage} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        {/* The giant word behind it all, sliding against the scroll. */}
        <div data-set="" className="absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div
            ref={word}
            className="font-condensed text-[34vw] leading-none font-bold tracking-[-0.02em] whitespace-nowrap text-[#EDEBE6] uppercase md:text-[26vw]"
          >
            {copyText.word}
          </div>
        </div>

        {/* The crane image in a box of its own pixel size, placed by the camera. No will-change, so the close
            re-rasters sharp. */}
        <div ref={world} className="absolute top-0 left-0 origin-top-left" style={{ width: CRANE.width, height: CRANE.height }}>
          {/* The truck waiting under the spreader, at the crane's scale, behind the crane's near leg (multiplied: its
              white ground disappears into the page). */}
          <div
            className="absolute"
            style={{ left: TRUCK_IN_CRANE.x, top: TRUCK_IN_CRANE.y, width: TRUCK_IN_CRANE.w, height: TRUCK_IN_CRANE.h }}
          >
            <TruckShadow />
            <SceneImage name="carreta-lado-vazia" alt="" sizes="(min-width: 768px) 90vw, 250vw" full className="relative h-full w-full" />
          </div>
          <div data-set="" data-sharp="" className="absolute inset-0">
            {/* A soft contact shadow under the legs. */}
            <div
              className="absolute rounded-[50%] bg-[radial-gradient(closest-side,rgb(10_19_56/0.22),transparent)]"
              style={{ left: GROUND.x0 - 160, width: GROUND.x1 - GROUND.x0 + 320, top: GROUND.y - 80, height: 160 }}
            />
            {/* The crane, always there: a light layer (1200 px) first, so no frame ever lacks it; the sharp one
                (4488 px on desktop, 1920 on phones) over it once decoded. */}
            <picture>
              <source type="image/avif" srcSet={base(1200, "avif")} />
              <img
                data-crane=""
                src={base(1200, "webp")}
                width={CRANE.width}
                height={CRANE.height}
                alt=""
                decoding="async"
                loading="lazy"
                className="absolute inset-0 h-full w-full"
              />
            </picture>
            <picture>
              <source media="(min-width: 768px)" type="image/avif" srcSet={base(4488, "avif")} />
              <source media="(min-width: 768px)" type="image/webp" srcSet={base(4488, "webp")} />
              <source type="image/avif" srcSet={base(1920, "avif")} />
              <img
                ref={sharp}
                src={base(1920, "webp")}
                width={CRANE.width}
                height={CRANE.height}
                alt=""
                decoding="async"
                loading="lazy"
                onLoad={showSharp}
                className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 ease-out"
              />
            </picture>
          </div>
          {/* The crane out of focus (depth of field): the light layer, blurred once, a layer of its own. */}
          <picture>
            <source type="image/avif" srcSet={base(1200, "avif")} />
            <img
              data-blurred=""
              src={base(1200, "webp")}
              width={CRANE.width}
              height={CRANE.height}
              alt=""
              decoding="async"
              loading="lazy"
              className="absolute inset-0 h-full w-full opacity-0 will-change-[opacity]"
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
              <SceneImage name="container-apg-lado" alt="" sizes="(min-width: 768px) 70vw, 140vw" className="block h-auto w-full" />
            </div>
            <div className="absolute" style={{ left: SPREADER_BOX.x, top: SPREADER_BOX.y, width: SPREADER_BOX.w }}>
              <SceneImage name="porteiner-spreader" alt="" sizes="(min-width: 768px) 75vw, 150vw" className="block h-auto w-full" />
            </div>
          </div>
        </div>

        {/* Marks in screen space, pinned to the picture by the camera: the quay's line and ruler, the dimensions,
            the callouts. */}
        <div ref={marks} className="pointer-events-none absolute inset-0">
          <i data-ground="" className="absolute top-0 left-0 size-px origin-top-left bg-navy-900/60" />
          <div data-set="" className="max-md:hidden">
            {Array.from({ length: RULER_TICKS }, (_, i) => (
              <i key={i} data-tick="" className="absolute top-0 left-0 size-px origin-top-left bg-navy-900/50" />
            ))}
            {Array.from({ length: Math.ceil(RULER_TICKS / 2) }, (_, i) => (
              <span key={i} data-tick-label="" className="absolute top-0 left-0 font-mono text-[11px] text-navy-900/70">
                {i * 2 * RULER_STEP_M} m
              </span>
            ))}
          </div>
          <div data-crane-cota="" className="opacity-0">
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <span className="absolute top-0 left-0 bg-[#fefefe] px-1.5 font-mono text-xs text-red-500">≈ {CRANE_HEIGHT_M} m</span>
          </div>
          <div data-drop-cota="" className="opacity-0">
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <i className="absolute top-0 left-0 size-px origin-top-left bg-red-500" />
            <span className="absolute top-0 left-0 bg-[#fefefe] px-1.5 font-mono text-xs text-red-500 tabular-nums" />
          </div>
          {(Object.keys(callouts) as (keyof typeof callouts)[]).map((k) => (
            <div key={k} data-callout={k} className="opacity-0">
              <i data-halo="" className="absolute top-0 left-0 size-px origin-top-left bg-[#fefefe]/80" />
              <i data-leader="" className="absolute top-0 left-0 size-px origin-top-left bg-navy-900" />
              <span data-label="" className="absolute top-0 left-0 bg-navy-900 px-2 py-1 font-mono text-xs leading-none tracking-[0.12em] whitespace-nowrap text-sand-50 uppercase">
                {callouts[k]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div ref={copy} className="site-container absolute inset-x-0 top-[13svh] text-navy-900 opacity-0">
        <div className="max-w-[30rem] max-md:rounded-sm max-md:bg-[#fefefe]/85 max-md:p-3">
          <ContainerCode index={homeCode("porteiner")} label={scene.code} />
          <p ref={title} className="font-condensed mt-3 max-w-[16ch] text-[clamp(1.6rem,3.8vw,3.4rem)] leading-[0.92] font-bold uppercase">
            {scene.text}
          </p>
          <dl className="mt-4 flex gap-8">
            {stats.map((s) => (
              <div key={s.unit}>
                <dt className="sr-only">{s.unit}</dt>
                <dd className="font-condensed text-3xl leading-none font-bold tabular-nums md:text-4xl">
                  <span className="sr-only">{count.format(s.value)} </span>
                  <span data-stat="" aria-hidden="true">
                    {count.format(s.value)}
                  </span>
                </dd>
                <dd aria-hidden="true" className="mt-1 font-mono text-xs tracking-[0.1em] text-navy-900/75 uppercase">
                  {s.unit}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Scene>
  );
}
