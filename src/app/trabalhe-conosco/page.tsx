import { ResumeForm } from "@/components/forms/ResumeForm";
import { CoverPhoto, PageHero } from "@/components/layout/PageHero";
import { site, type NavLink } from "@/content/site";

const page = site.nav.find((item): item is NavLink => "href" in item && item.href === "/trabalhe-conosco")!;
const { careers } = site.pages;

export const metadata = { title: page.label };

export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
      <PageHero title={careers.title} text={careers.text}>
        <CoverPhoto name="terminal-aereo" phone="terminal-aereo-mobile" alt={careers.photoAlt} />
      </PageHero>
      <section data-header-theme="light" className="bg-sand-50 py-16 text-navy-900 md:py-28">
        <div className="site-container max-w-4xl">
          <ResumeForm />
        </div>
      </section>
    </main>
  );
}
