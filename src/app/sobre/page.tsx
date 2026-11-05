import { CoverPhoto, PageHero } from "@/components/layout/PageHero";
import { History } from "@/components/ui/History";
import { site, type NavLink } from "@/content/site";

const page = site.nav.find((item): item is NavLink => "href" in item && item.href === "/sobre")!;
const { about } = site.pages;

export const metadata = { title: page.label };

export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
      <PageHero title={about.title} text={about.text}>
        <CoverPhoto name="hero-porto" phone="hero-porto-mobile" alt={about.photoAlt} />
      </PageHero>
      {/* The history, as scene 4's track tells it, still. */}
      <section className="bg-sand-50 py-24 text-navy-900 md:py-36">
        <div className="site-container">
          <History as="h2" />
        </div>
      </section>
      <section className="bg-navy-900 py-24 text-sand-50 md:py-32">
        <div className="site-container grid gap-14 md:grid-cols-2">
          <div>
            <h2 className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">{about.missionTitle}</h2>
            <p className="mt-5 max-w-[46ch] text-lg leading-snug text-sand-50/85">{site.mission}</p>
          </div>
          <div>
            <h2 className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">{about.valuesTitle}</h2>
            <ul className="mt-5 grid gap-3 font-mono text-sm tracking-[0.12em] uppercase">
              {site.values.map((v) => (
                <li key={v} className="border-l-2 border-red-500 pl-3">
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
