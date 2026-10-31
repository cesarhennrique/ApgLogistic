"use client";

import { useEffect, useRef } from "react";
import images from "@/content/journeyImages.json";
import { site } from "@/content/site";
import { APG_CONTAINERS, PHOTO, type View } from "./oceanCamera";

const { widths } = images["navio-mar"];
const src = (w: number, ext: string) => `/images/journey/navio-mar-${w}.${ext}`;
// Up to 1920: the original (6688) is the close's own layer, loaded later, on desktop only.
const base = widths.filter((w) => w <= 1920);
const srcSet = (ext: string) => base.map((w) => `${src(w, ext)} ${w}w`).join(", ");
// Its width at the wide framing: the photo covering the screen.
const SIZES = `(min-aspect-ratio: ${PHOTO.width}/${PHOTO.height}) 100vw, ${((PHOTO.width / PHOTO.height) * 100).toFixed(1)}vh`;
const ORIGINAL = { avif: src(PHOTO.width, "avif"), webp: src(PHOTO.width, "webp") };

export const viewOf = (stage: HTMLElement): View => ({
  width: stage.clientWidth,
  height: stage.clientHeight,
  dpr: window.devicePixelRatio || 1,
});

type Note = { group: HTMLElement; leader: HTMLElement | null; label: HTMLElement; bars: HTMLElement[] };

// One copy of scene 1's picture: the photo, its original for the close, and the notes drawn over it. The hero's
// last screen shows one, scene 1 another; scene 1 draws both with the same camera, so while it slides in over the
// hero the two halves are one picture.
export type Frame = {
  root: HTMLElement;
  photo: HTMLElement;
  sharp: { source: HTMLSourceElement; img: HTMLImageElement; loaded: boolean };
  // One per APG container: its four edges.
  outlines: Note[];
  heading: Note;
  containers: Note;
  target: Note;
};

export const frames = new Set<Frame>();
let redraw: (() => void) | null = null;
// Scene 1 draws every frame; a frame mounted later gets drawn at once.
export const setRedraw = (fn: (() => void) | null) => (redraw = fn);

// The original, once scene 1 comes near (desktop only): set on every frame, fetched once.
export function loadSharp() {
  for (const f of frames) {
    if (f.sharp.img.getAttribute("src")) continue;
    f.sharp.img.onload = () => {
      f.sharp.loaded = true;
      redraw?.();
    };
    f.sharp.source.srcset = ORIGINAL.avif;
    f.sharp.img.src = ORIGINAL.webp;
  }
}

// A 1 px box scaled to a bar, a leader or an edge: only its transform changes, so its stroke never thickens.
const Bar = ({ className = "bg-red-500" }: { className?: string }) => (
  <i data-bar="" className={`absolute top-0 left-0 size-px origin-top-left ${className}`} />
);
const Label = ({ children }: { children: string }) => (
  <span
    data-label=""
    // navy at 70% under white mono text: AA over any part of the photo
    className="absolute top-0 left-0 bg-navy-900/70 px-2 py-1 font-mono text-[11px] leading-none tracking-[0.14em] whitespace-nowrap text-sand-50"
  >
    {children}
  </span>
);

const note = (group: Element): Note => ({
  group: group as HTMLElement,
  leader: group.querySelector<HTMLElement>("[data-leader]"),
  label: group.querySelector<HTMLElement>("[data-label]")!,
  bars: [...group.querySelectorAll<HTMLElement>("[data-bar]:not([data-leader])")],
});

export function ArrivalFrame({ alt }: { alt: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const q = <T extends Element>(s: string) => el.querySelector<T>(s)!;
    const frame: Frame = {
      root: el,
      photo: q("[data-photo]"),
      sharp: { source: q("[data-sharp] source"), img: q("[data-sharp] img"), loaded: false },
      outlines: [...el.querySelectorAll("[data-outline]")].map(note),
      heading: note(q("[data-note=heading]")),
      containers: note(q("[data-note=containers]")),
      target: note(q("[data-note=target]")),
    };
    frames.add(frame);
    redraw?.();
    return () => void frames.delete(frame);
  }, []);

  const { notes } = site.journeyScene;
  return (
    <div ref={root} className="absolute inset-0 overflow-hidden">
      {/* The photo in a box of its own pixel size, placed by the camera (oceanCamera). No will-change: the browser
          re-rasters the image at each scale, so the close stays sharp. */}
      <div data-photo="" className="absolute top-0 left-0 origin-top-left" style={{ width: PHOTO.width, height: PHOTO.height }}>
        <picture>
          <source type="image/avif" srcSet={srcSet("avif")} sizes={SIZES} />
          <source type="image/webp" srcSet={srcSet("webp")} sizes={SIZES} />
          <img
            src={src(1920, "webp")}
            width={PHOTO.width}
            height={PHOTO.height}
            alt={alt}
            sizes={SIZES}
            decoding="async"
            // In view under the hero from the start (transparent): lazy keeps it off the LCP's path.
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
        </picture>
        {/* The original, crossfaded over the same box: no jump between the two. */}
        <picture data-sharp="">
          <source type="image/avif" />
          <img alt="" decoding="async" className="absolute inset-0 h-full w-full opacity-0" />
        </picture>
      </div>

      {/* Notes in screen space, pinned to the photo by the camera. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {APG_CONTAINERS.map((c) => (
          <div key={`${c.x},${c.y}`} data-outline="" className="absolute inset-0 opacity-0">
            <Bar />
            <Bar />
            <Bar />
            <Bar />
          </div>
        ))}
        {(["heading", "containers"] as const).map((n) => (
          <div key={n} data-note={n} className="absolute inset-0 opacity-0">
            <i data-bar="" data-leader="" className="absolute top-0 left-0 size-px origin-top-left bg-sand-50" />
            <Label>{notes[n]}</Label>
          </div>
        ))}
        <div data-note="target" className="absolute inset-0 opacity-0">
          {Array.from({ length: 8 }, (_, i) => (
            <Bar key={i} />
          ))}
          <Label>{notes.target}</Label>
        </div>
      </div>
    </div>
  );
}
