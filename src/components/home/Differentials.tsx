import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";

export function Differentials() {
  return (
    <section className="bg-navy-900 py-24 text-sand-50 md:py-36">
      <div className="site-container">
        <ContainerCode index={homeCode("differentials")} label={site.home.differentials.code} />
        <h2 className="font-condensed mt-5 text-5xl leading-[0.9] font-bold uppercase md:text-7xl">
          {site.home.differentials.title}
        </h2>
        <ul className="mt-14 grid gap-x-8 gap-y-12 md:mt-20 md:grid-cols-2 xl:grid-cols-4">
          {site.differentials.map((d) => (
            <li key={d.title} className="border-t-2 border-sand-50/20 pt-6">
              <p className="font-condensed text-6xl leading-none font-bold md:text-7xl">{d.figure}</p>
              <h3 className="mt-5 text-lg font-semibold">{d.title}</h3>
              <p className="mt-2 text-sand-50/75">{d.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
