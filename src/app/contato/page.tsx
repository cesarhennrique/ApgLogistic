import { QuoteForm } from "@/components/forms/QuoteForm";
import { CoverPhoto, PageHero } from "@/components/layout/PageHero";
import { site, type NavLink } from "@/content/site";

const page = site.nav.find((item): item is NavLink => "href" in item && item.href === "/contato")!;
const { contact } = site.pages;
const { matriz, filial } = site.addresses;
const phone = site.phones[0];
// The terminal on Google Maps' embed (no API key), by its address.
const MAP = `https://www.google.com/maps?q=${encodeURIComponent(`${matriz.complement}, ${matriz.street}, ${matriz.city} - ${matriz.state}`)}&output=embed`;

export const metadata = { title: page.label };

export default function Page() {
  return (
    <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
      <PageHero title={contact.title} text={contact.text}>
        <CoverPhoto name="hero-porto" phone="hero-porto-mobile" alt={contact.photoAlt} />
      </PageHero>
      <section data-header-theme="light" className="bg-sand-50 py-16 text-navy-900 md:py-28">
        <div className="site-container grid items-start gap-14 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
          <QuoteForm />
          <aside aria-labelledby="addresses-title" className="grid gap-8">
            <h2 id="addresses-title" className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">
              {contact.addressesTitle}
            </h2>
            <a
              href={phone.href}
              className="font-mono-tabular w-fit text-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
            >
              <span className="block font-mono text-[11px] tracking-[0.16em] text-navy-900/75 uppercase">{site.ui.phone} · 24 h</span>
              {phone.display}
            </a>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[matriz, filial].map((a) => (
                <div key={a.label} className="border-l-2 border-red-500 pl-4">
                  <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase">{a.label}</h3>
                  <address className="mt-2 text-sm leading-relaxed text-navy-900/80 not-italic">
                    {a.street}
                    <br />
                    {a.complement}
                    <br />
                    {a.district}, {a.city} – {a.state}
                    <br />
                    {site.ui.zip} {a.zip}
                  </address>
                </div>
              ))}
            </div>
            <iframe
              src={MAP}
              title={contact.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full border border-navy-900/15 grayscale"
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
