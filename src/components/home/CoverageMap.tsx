import { readFileSync } from "node:fs";
import { join } from "node:path";
import { InView } from "@/components/motion/InView";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { site } from "@/content/site";

// Read at build time (SSG) and inlined, so states and routes can be styled with tokens.
const svg = readFileSync(join(process.cwd(), "public/images/map/nordeste.svg"), "utf8");
const viewBox = svg.match(/viewBox="([^"]+)"/)![1];
const states = [...svg.matchAll(/<path id="([A-Z]{2})" d="([^"]+)"\/>/g)].map(([, id, d]) => ({ id, d }));

// Same projection as scripts/clean-map.mjs: 1 unit = 0.01°.
const project = (lon: number, lat: number) => [(lon + 49) * 100, (2 - lat) * 100] as const;

const { hubs, routes, highlight } = site.home.coverage;
const hubPoint = Object.fromEntries(hubs.map((h) => [h.label, project(h.lon, h.lat)]));

// Quadratic arc bowed 18% of its length to one side, so the fan of routes reads as movement.
const arcs = routes.map((r) => {
  const [x1, y1] = hubPoint[r.from];
  const [x2, y2] = project(r.lon, r.lat);
  const [dx, dy] = [x2 - x1, y2 - y1];
  const [cx, cy] = [x1 + dx / 2 - dy * 0.18, y1 + dy / 2 + dx * 0.18];
  return `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`;
});

export function CoverageMap() {
  const { code, title, text } = site.home.coverage;
  return (
    <section className="border-t border-sand-50/10 bg-navy-900 py-24 md:py-36">
      <div className="site-container grid items-center gap-14 md:grid-cols-[5fr_7fr] md:gap-20">
        <div>
          <ContainerCode index={6} label={code} />
          <h2 className="font-condensed mt-5 text-5xl leading-[0.9] font-bold uppercase md:text-7xl">{title}</h2>
          <p className="mt-6 max-w-md text-lg text-sand-50/80">{text}</p>
          <ul className="mt-10 space-y-4 text-sm">
            {Object.values(site.addresses).map((a) => (
              <li key={a.label} className="flex items-baseline gap-3">
                <span aria-hidden="true" className="size-2.5 shrink-0 translate-y-[-1px] rounded-full bg-red-500" />
                <span>
                  <span className="font-semibold">{a.label}</span>
                  <span className="text-steel-400">
                    {" "}
                    {a.city} – {a.state}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <InView className="mx-auto w-full max-w-xl">
          <svg viewBox={viewBox} role="img" aria-label={`${title}. ${text}`} className="h-auto w-full overflow-visible">
            {states.map((s) => (
              <path
                key={s.id}
                d={s.d}
                vectorEffect="non-scaling-stroke"
                className={
                  highlight.includes(s.id)
                    ? "fill-blue-600 stroke-sand-50/50"
                    : "fill-sand-50/[0.04] stroke-sand-50/20"
                }
              />
            ))}
            {arcs.map((d, i) => (
              <path
                key={d}
                d={d}
                pathLength={1}
                fill="none"
                strokeWidth={6}
                strokeLinecap="round"
                className="route-line stroke-red-500"
                style={{ transitionDelay: `${i * 90}ms` }}
              />
            ))}
            {hubs.map((h) => {
              const [x, y] = hubPoint[h.label];
              return (
                <g key={h.label}>
                  <circle cx={x} cy={y} r={16} className="fill-red-500" />
                  <circle cx={x} cy={y} r={30} className="fill-none stroke-red-500/50" strokeWidth={4} />
                  {/* labels sit west of the hubs: Suape is on the coast, east would leave the map */}
                  <text x={x - 44} y={y + 14} textAnchor="end" className="fill-sand-50 font-mono text-[44px]">
                    {h.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </InView>
      </div>
    </section>
  );
}
