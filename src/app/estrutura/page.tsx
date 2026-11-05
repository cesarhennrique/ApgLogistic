import { CoverPhoto, PageHero } from "@/components/layout/PageHero";
import { Scoreboard } from "@/components/ui/Scoreboard";
import { site, type NavLink } from "@/content/site";

const page = site.nav.find((item): item is NavLink => "href" in item && item.href === "/estrutura")!;
const { structure } = site.pages;

export const metadata = { title: page.label };

export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
      <PageHero title={structure.title} text={structure.text}>
        <CoverPhoto name="terminal-aereo" phone="terminal-aereo-mobile" alt={structure.photoAlt} />
      </PageHero>
      {/* The terminal's numbers, the scoreboard scene 4's dock shows. */}
      <section className="bg-sand-50 py-24 text-navy-900 md:py-32">
        <div className="site-container">
          <Scoreboard />
        </div>
      </section>
    </main>
  );
}
