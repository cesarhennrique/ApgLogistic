import { site } from "@/content/site";

const { dock } = site.journeyScene;
const count = new Intl.NumberFormat("pt-BR");

// The CONE terminal's numbers as a scoreboard, still (scene 4's dock, for reduced motion and /estrutura).
export function Scoreboard() {
  return (
    <>
      <p className="font-mono text-xs tracking-[0.12em] text-navy-900/75 uppercase">{dock.label}</p>
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
    </>
  );
}
