import { Counter } from "@/components/motion/Counter";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { site } from "@/content/site";

export function Stats() {
  return (
    <section className="bg-navy-900 py-24 md:py-32">
      <div className="site-container">
        <ContainerCode index={3} label={site.home.stats.code} />
        <h2 className="font-condensed mt-5 text-4xl leading-none font-bold uppercase md:text-6xl">
          {site.home.stats.title}
        </h2>
        {/* type steps up with the column count so the widest value (35.000 m²) never overflows its cell */}
        <dl className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 xl:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse border-t border-sand-50/15 pt-5">
              <dt className="font-mono-tabular mt-3 text-xs leading-relaxed text-steel-400">{s.label}</dt>
              <dd className="text-2xl font-semibold md:text-3xl xl:text-5xl">
                <Counter value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
