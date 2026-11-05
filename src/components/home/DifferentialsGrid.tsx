"use client";

import { Truck } from "lucide-react";
import { useEffect, useRef } from "react";
import { Counter } from "@/components/motion/Counter";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useQualityTier } from "@/lib/quality";
import { site } from "@/content/site";

export type PeMap = { dots: [number, number][]; routes: string[]; box: [number, number, number, number] };

const recife = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", hour: "2-digit", minute: "2-digit", second: "2-digit" });
// Recife's hour and minute now, as the hands' angles.
function handsNow() {
  const [h, m] = recife.format(new Date()).split(":").map(Number);
  return { hour: ((h % 12) + m / 60) * 30, minute: m * 6 };
}

// Each little picture plays once, as its cell comes in (data-in, CSS transitions staggered by --i): the fleet's ten
// trucks lighting one by one; the yard's containers filling the grid, its dimension drawn; Pernambuco's dots, five
// trackers moving on their routes, each with its GPS pulse; the clock's hands going round to Recife's time, the time
// itself live in mono. Reduced motion: each already in its end state, still.
const IN = "transition-[opacity,transform] duration-500 ease-out";

function Fleet() {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-2" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <Truck
          key={i}
          strokeWidth={1.25}
          className={`size-7 text-sand-50 opacity-20 group-data-in:opacity-100 motion-reduce:opacity-100 ${IN}`}
          style={{ transitionDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

// Seen from above: 8 × 4 containers, navy with the red stripe, then the yard's dimension under them.
function Yard() {
  const cols = 8;
  const rows = 4;
  return (
    <svg viewBox="0 0 268 92" className="w-full max-w-[268px]" aria-hidden="true">
      {Array.from({ length: cols * rows }, (_, i) => {
        const [c, r] = [i % cols, Math.floor(i / cols)];
        return (
          <g
            key={i}
            className={`origin-center [transform-box:fill-box] scale-75 opacity-0 group-data-in:scale-100 group-data-in:opacity-100 motion-reduce:scale-100 motion-reduce:opacity-100 ${IN}`}
            style={{ transitionDelay: `${(c + r * 2) * 40}ms` }}
          >
            <rect x={c * 33} y={r * 18} width={30} height={14} className="fill-blue-600 stroke-sand-50/30" strokeWidth={0.75} />
            <rect x={c * 33} y={r * 18 + 6} width={30} height={2} className="fill-red-500" />
          </g>
        );
      })}
      <g className="stroke-red-500" strokeWidth={1}>
        <path d="M0 82H262M0 78V86M262 78V86" />
      </g>
    </svg>
  );
}

function Tracking({ pe, live }: { pe: PeMap; live: boolean }) {
  const [x, y, w, h] = pe.box;
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} className="w-full max-w-[320px]" aria-hidden="true">
      {pe.dots.map(([dx, dz], i) => (
        <circle key={i} cx={dx} cy={dz} r={0.13} className="fill-sand-50/45" />
      ))}
      {pe.routes.map((d) => (
        <path key={d} d={d} fill="none" className="stroke-red-500/35" strokeWidth={0.08} strokeDasharray="0.3 0.3" />
      ))}
      {pe.routes.map((d, i) => (
        <g key={`t${d}`}>
          {/* still at the route's start with reduced motion; moving, slowly, otherwise */}
          {live && <animateMotion path={d} dur={`${10 + i * 2.5}s`} begin={`${-i * 2}s`} repeatCount="indefinite" />}
          <circle r={0.9} className="fill-red-500/30">
            {live && <animateTransform attributeName="transform" type="scale" values="0.3;1.6" dur="1.8s" repeatCount="indefinite" />}
            {live && <animate attributeName="opacity" values="0.9;0" dur="1.8s" repeatCount="indefinite" />}
          </circle>
          <circle r={0.32} className="fill-red-500" />
        </g>
      ))}
    </svg>
  );
}

function Clock({ hands }: { hands: React.RefObject<SVGGElement | null> }) {
  return (
    <svg viewBox="-50 -50 100 100" className="size-32" aria-hidden="true">
      <circle r={46} fill="none" className="stroke-sand-50/40" strokeWidth={1} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={i % 3 ? "M0 -44V-40" : "M0 -44V-36"} className="stroke-sand-50" strokeWidth={i % 3 ? 1 : 1.5} transform={`rotate(${i * 30})`} />
      ))}
      <g ref={hands}>
        {/* a full turn as it comes in, to Recife's hour and minute (CSS: --hour, --minute set on mount) */}
        <path
          d="M0 4V-24"
          className={`stroke-sand-50 [transform:rotate(0deg)] group-data-in:[transform:rotate(calc(360deg+var(--hour)))] motion-reduce:[transform:rotate(var(--hour))] transition-transform duration-[1600ms] ease-out`}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <path
          d="M0 6V-38"
          className={`stroke-red-500 [transform:rotate(0deg)] group-data-in:[transform:rotate(calc(720deg+var(--minute)))] motion-reduce:[transform:rotate(var(--minute))] transition-transform duration-[1600ms] ease-out`}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </g>
      <circle r={2.5} className="fill-red-500" />
    </svg>
  );
}

export function DifferentialsGrid({ pe }: { pe: PeMap }) {
  const grid = useRef<HTMLUListElement>(null);
  const hands = useRef<SVGGElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  // the trackers still on the 'low' tier (lib/quality)
  const tier = useQualityTier();

  useEffect(() => {
    const cells = [...grid.current!.children] as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) (e.target as HTMLElement).setAttribute("data-in", "");
      },
      { threshold: 0.4 },
    );
    for (const c of cells) io.observe(c);
    // the clock: Recife's time, live; the hands' angles for it
    const tick = () => {
      time.current!.textContent = recife.format(new Date());
      const { hour, minute } = handsNow();
      hands.current!.style.setProperty("--hour", `${hour}deg`);
      hands.current!.style.setProperty("--minute", `${minute}deg`);
    };
    tick();
    const every = window.setInterval(tick, 1000);
    return () => {
      io.disconnect();
      window.clearInterval(every);
    };
  }, []);

  return (
    <ul ref={grid} className="mt-14 grid border-t border-l border-sand-50/15 md:mt-20 md:grid-cols-2">
      {site.differentials.map((d) => (
        <li key={d.title} className="group relative flex flex-col gap-8 border-r border-b border-sand-50/15 p-6 md:min-h-[24rem] md:p-10">
          {/* technical corner ticks */}
          <span aria-hidden="true" className="absolute top-3 left-3 size-2.5 border-t border-l border-red-500/70" />
          <span aria-hidden="true" className="absolute right-3 bottom-3 size-2.5 border-r border-b border-red-500/70" />
          <div className="flex min-h-32 items-center">
            {d.viz === "fleet" && <Fleet />}
            {d.viz === "yard" && <Yard />}
            {d.viz === "tracking" && <Tracking pe={pe} live={!reduced && tier !== "low"} />}
            {d.viz === "clock" && (
              <div className="flex items-center gap-6">
                <Clock hands={hands} />
                <p className="font-mono text-xs tracking-[0.12em] text-sand-50/75 uppercase">
                  {site.home.differentials.clock}
                  <span ref={time} className="font-mono-tabular mt-1 block text-2xl text-sand-50">
                    --:--:--
                  </span>
                </p>
              </div>
            )}
          </div>
          <div className="mt-auto">
            <p className="font-condensed text-6xl leading-none font-bold md:text-7xl">
              <Counter value={d.value} suffix={d.unit} className="font-condensed" />
            </p>
            {"second" in d && <p className="font-mono-tabular mt-2 text-sm text-sand-50/75">{d.second}</p>}
            <h3 className="mt-5 font-mono text-sm tracking-[0.12em] uppercase">{d.title}</h3>
            <p className="mt-2 max-w-[40ch] text-sand-50/75">{d.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
