"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "@/components/motion/gsap";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { Scene, segment } from "./Scene";
import { SceneImage } from "./SceneImage";
import {
  ARROWS,
  DIMENSIONS,
  DOCKS,
  FENCE,
  GATE,
  PLAN,
  ROAD_WIDTH,
  ROADS,
  STACKS,
  TARGET_DOCK,
  TRUCK_IMAGE,
  TRUCK_PATH,
  WAREHOUSE,
  stackLines,
} from "./terminalPlan";

const scene = site.journey.find((s) => s.id === "terminal")!;
const HEIGHT_VH = 260;

// The script (spec §3), over the scene's progress: the plan draws itself in as the scene comes in (CSS, once); the
// truck, seen from above, comes in at the gate and drives to its dock, turning with the road, the red line drawn
// behind it; the plan's dimensions come in one by one; then it holds.
const DRIVE = [0.08, 0.78] as const;
const driveEase = gsap.parseEase("power1.inOut");
const DIMENSION_IN = [0.15, 0.32, 0.49, 0.66];
const DIMENSION_FADE = 0.07;
// The dimensions' labels: the scene's line, item by item ("35.000 m² · 4.000 TEUs estáticos · …").
const LABELS = scene.text.split(" · ");

// Phones: the plan turned 90° (portrait), to fill the screen's height; its words turned back, to read level.
const PHONE = "(max-width: 767px)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
// Its names and numbers at least this big on screen, whatever the plan's scale.
const LABEL_PX = 12;

const pctX = (x: number) => `${(x / PLAN.width) * 100}%`;
const pctY = (y: number) => `${(y / PLAN.height) * 100}%`;
// Thin and even at any size.
const line = { vectorEffect: "non-scaling-stroke", strokeWidth: 1 } as const;
const LABEL = { fontSize: "var(--label, 12px)" };

// Scene 5: the CONE terminal as a technical drawing, the truck's photo driving over it.
export function Terminal() {
  const plan = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const route = useRef<SVGPathElement>(null);
  const truck = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const turned = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE).matches,
    () => false,
  );
  const raw = useRef(0);

  const apply = useCallback(() => {
    const p = reduced ? 1 : raw.current;
    const path = route.current!;
    const total = path.getTotalLength();
    const t = driveEase(segment(p, ...DRIVE));
    // The truck at its point on the path, turned to the path's tangent (its nose points up in the image).
    const at = path.getPointAtLength(t * total);
    const ahead = path.getPointAtLength(Math.min(t * total + 1, total));
    const behind = path.getPointAtLength(Math.max(t * total - 1, 0));
    const angle = Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * (180 / Math.PI) + 90;
    const s = plan.current!.offsetWidth / PLAN.width;
    svg.current!.style.setProperty("--label", `${(LABEL_PX / s).toFixed(2)}px`);
    const el = truck.current!;
    el.style.transform = `translate3d(${(at.x * s - el.offsetWidth / 2).toFixed(1)}px, ${(at.y * s - el.offsetHeight / 2).toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg)`;
    // The red line: the path itself, up to the truck.
    path.style.strokeDashoffset = String(1 - t);
    // The dimensions, one at a time.
    // (on the plan, and in the phones' legend)
    for (const group of document.querySelectorAll("#terminal [data-dims]")) {
      [...group.children].forEach((d, i) => {
        const fade = reduced ? 1 : segment(p, DIMENSION_IN[i], DIMENSION_IN[i] + DIMENSION_FADE);
        (d as HTMLElement).style.opacity = String(fade);
      });
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
    observer.observe(plan.current!);
    return () => observer.disconnect();
  }, [apply]);

  // The plan draws itself in once, as the scene comes into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        svg.current!.setAttribute("data-drawn", "");
        io.disconnect();
      },
      { rootMargin: "0px 0px -40% 0px" },
    );
    io.observe(plan.current!);
    return () => io.disconnect();
  }, []);

  const { plan: names } = site.journeyScene;
  // A word turned back level on phones, about its own anchor.
  const level = (x: number, y: number) => (turned ? `rotate(-90 ${x} ${y})` : undefined);
  const r = ROAD_WIDTH / 2;
  return (
    <Scene id="terminal" heightVh={HEIGHT_VH} background="#f3efe7" headerTheme="light" onProgress={onProgress}>
      <div className="site-container absolute inset-x-0 top-[13svh] text-navy-900">
        <ContainerCode index={homeCode("terminal")} label={scene.code} />
        <p className="font-mono-tabular mt-2 text-xs text-navy-900/70">{site.journeyScene.suapeHover}</p>
        <p className="sr-only">{scene.text}</p>
        {/* Phones: the dimensions' legend (the plan's marks 1–4). */}
        <ol data-dims="" aria-hidden="true" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs text-navy-900 md:hidden">
          {LABELS.map((label, i) => (
            <li key={label} className="flex items-center gap-2 opacity-0">
              <span className="grid size-5 shrink-0 place-items-center rounded-full border border-navy-900/60 text-[11px]">{i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </div>

      <div
        ref={plan}
        aria-hidden="true"
        // wide: up to 80vw × 70svh, low in the frame; phones: turned 90° about its centre, as tall as the screen below
        // the copy allows (its width, turned, is its height on screen)
        className="absolute left-1/2 aspect-[1000/660] -translate-x-1/2 max-md:top-[calc(50%+6.25rem)] max-md:w-[min(calc(100svh-236px),calc(92vw*1000/660))] max-md:-translate-y-1/2 max-md:rotate-90 md:bottom-[5svh] md:w-[min(80vw,calc(70svh*1000/660))]"
      >
        <svg ref={svg} viewBox={`0 0 ${PLAN.width} ${PLAN.height}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          <g className="stroke-navy-900/60">
            {/* Roads: their edges, then the same boxes in the paper's colour (inset) to clear the crossings. */}
            {ROADS.map((d) => (
              <rect
                key={`${d.x0},${d.y0},${d.x1},${d.y1}`}
                className="plan-stroke"
                pathLength={1}
                x={Math.min(d.x0, d.x1) - r}
                y={Math.min(d.y0, d.y1) - r}
                width={Math.abs(d.x1 - d.x0) + 2 * r}
                height={Math.abs(d.y1 - d.y0) + 2 * r}
                {...line}
              />
            ))}
          </g>
          <g className="fill-[#f3efe7]">
            {ROADS.map((d) => (
              <rect
                key={`${d.x0},${d.y0},${d.x1},${d.y1}`}
                x={Math.min(d.x0, d.x1) - r + 1}
                y={Math.min(d.y0, d.y1) - r + 1}
                width={Math.abs(d.x1 - d.x0) + 2 * r - 2}
                height={Math.abs(d.y1 - d.y0) + 2 * r - 2}
              />
            ))}
          </g>
          <g className="plan-text stroke-navy-900/30" strokeDasharray="6 6">
            {ROADS.map((d) => (
              <line key={`${d.x0},${d.y0},${d.x1},${d.y1}`} x1={d.x0} y1={d.y0} x2={d.x1} y2={d.y1} {...line} />
            ))}
          </g>
          <g className="plan-text fill-navy-900/50">
            {ARROWS.map((a) => (
              <path key={`${a.x},${a.y}`} d="M-6 -4L0 0L-6 4Z" transform={`translate(${a.x} ${a.y}) rotate(${a.a})`} />
            ))}
          </g>

          <g className="stroke-navy-900/60">
            <path className="plan-stroke" pathLength={1} d={FENCE} {...line} />
            <rect className="plan-stroke" pathLength={1} {...GATE.house} {...line} />
            {STACKS.map((b) => (
              <g key={`${b.x},${b.y}`}>
                <rect className="plan-stroke" pathLength={1} x={b.x} y={b.y} width={b.w} height={b.h} {...line} />
                <path className="plan-stroke stroke-navy-900/25" pathLength={1} d={stackLines(b)} {...line} />
              </g>
            ))}
            <rect className="plan-stroke" pathLength={1} x={WAREHOUSE.x} y={WAREHOUSE.y} width={WAREHOUSE.w} height={WAREHOUSE.h} {...line} />
            {DOCKS.map((d) => (
              <rect
                key={d.n}
                className={`plan-stroke ${d.n === TARGET_DOCK ? "stroke-red-500" : ""}`}
                pathLength={1}
                x={d.x}
                y={d.y}
                width={d.w}
                height={d.h}
                {...line}
              />
            ))}
            {DIMENSIONS.map((d) => (
              <path
                key={`${d.x0},${d.y0}`}
                className="plan-stroke stroke-navy-900/70"
                pathLength={1}
                // the line, its end ticks (45°) and its extension lines to what it measures
                d={`M${d.x0} ${d.y0}H${d.x1}M${d.x0 - 4} ${d.y0 + 4}l8 -8M${d.x1 - 4} ${d.y0 + 4}l8 -8M${d.x0} ${d.y0 - 6}V${d.ext[0]}M${d.x1} ${d.y0 - 6}V${d.ext[1]}`}
                {...line}
              />
            ))}
          </g>

          {/* Names and numbers, small mono, as on a drawing. */}
          {/* Names and numbers, mono, as on a drawing: at least LABEL_PX on screen (--label, set from the scale);
              the docks' numbers are the drawing's texture. Turned back level on phones. */}
          <g className="plan-text fill-navy-900/70 font-mono" textAnchor="middle" dominantBaseline="central">
            {STACKS.map((b) => {
              const [x, y] = [b.x + b.w / 2, b.y + b.h / 2];
              return (
                <text key={`${x},${y}`} x={x} y={y} transform={level(x, y)} className="fill-navy-900" paintOrder="stroke" stroke="#f3efe7" strokeWidth={4} style={LABEL}>
                  {b.teus}
                </text>
              );
            })}
            {DOCKS.map((d) => (
              <text key={d.n} x={d.x + d.w / 2} y={d.y + d.h / 2} fontSize={5.5} transform={level(d.x + d.w / 2, d.y + d.h / 2)}>
                {String(d.n).padStart(2, "0")}
              </text>
            ))}
            <text x={WAREHOUSE.x + WAREHOUSE.w / 2} y={WAREHOUSE.y + WAREHOUSE.h / 2} transform={level(WAREHOUSE.x + WAREHOUSE.w / 2, WAREHOUSE.y + WAREHOUSE.h / 2)} letterSpacing={2} style={LABEL}>
              {names.warehouse.toLocaleUpperCase("pt-BR")}
            </text>
            <text x={GATE.house.x + GATE.house.w + 6} y={GATE.house.y + GATE.house.h / 2} transform={level(GATE.house.x + GATE.house.w + 6, GATE.house.y + GATE.house.h / 2)} textAnchor="start" letterSpacing={1} style={LABEL}>
              {names.gate.toLocaleUpperCase("pt-BR")}
            </text>
          </g>

          {/* The truck's route, red, revealed behind it. */}
          <path ref={route} d={TRUCK_PATH} pathLength={1} className="stroke-red-500" strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeDasharray="1" strokeDashoffset="1" />
        </svg>

        {/* The dimensions' labels: screen-sized mono over the line they measure. On phones (the plan turned, the
            lines upright) a numbered mark, level, keyed to the legend under the title. */}
        <div data-dims="">
          {DIMENSIONS.map((d, i) => (
            <span
              key={LABELS[i]}
              className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#f3efe7] px-1.5 font-mono text-xs tracking-[0.08em] whitespace-nowrap text-navy-900 opacity-0 max-md:-rotate-90 max-md:rounded-full max-md:border max-md:border-navy-900/60 max-md:px-1.5"
              style={{ left: pctX(d.label.x), top: pctY(d.label.y) }}
            >
              <span className="md:hidden">{i + 1}</span>
              <span className="max-md:hidden">{LABELS[i]}</span>
            </span>
          ))}
        </div>

        {/* The truck from above, a lane wide. */}
        <div
          ref={truck}
          className="absolute top-0 left-0 aspect-[941/1672]"
          style={{ width: pctX(TRUCK_IMAGE.width) }}
        >
          <SceneImage name="carreta-cima" alt="" sizes="6vw" className="block h-auto w-full" />
        </div>
      </div>
    </Scene>
  );
}
