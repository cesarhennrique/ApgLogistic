import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceCard } from "@/components/home/ServiceCard";
import { ServiceHero } from "@/components/layout/ServiceHero";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";

// Every slug is built ahead (generateStaticParams); the page reads its params at the top, so a navigation to it may
// wait for its payload instead of an instant shell (Cache Components' validation): it is a few KB, prefetched.
export const instant = false;

export function generateStaticParams() {
  return site.services.map((s) => ({ slug: s.slug }));
}

const findService = async (params: PageProps<"/servicos/[slug]">["params"]) => {
  const { slug } = await params;
  return site.services.find((s) => s.slug === slug);
};

export async function generateMetadata({ params }: PageProps<"/servicos/[slug]">): Promise<Metadata> {
  return { title: (await findService(params))?.title };
}

const { service: labels } = site.pages;

export default async function Page({ params }: PageProps<"/servicos/[slug]">) {
  const service = await findService(params);
  if (!service) notFound();
  return (
    <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
      <ServiceHero service={service} />
      <section className="bg-sand-50 py-24 text-navy-900 md:py-32">
        <div className="site-container grid gap-16 md:grid-cols-2">
          <div>
            <h2 className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">{labels.includes}</h2>
            <ul className="mt-8 grid gap-4">
              {service.bullets.map((b) => (
                <li key={b} className="border-l-2 border-red-500 pl-4 text-lg leading-snug">
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <CtaButton href="/contato">{site.cta.quote}</CtaButton>
            </div>
          </div>
          <div>
            <h2 className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">{labels.faq}</h2>
            <dl className="mt-8 grid gap-8">
              {service.faq.map((f) => (
                <div key={f.question}>
                  <dt className="font-semibold">{f.question}</dt>
                  <dd className="mt-2 leading-snug text-navy-900/75">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
      <section className="bg-sand-50 pb-24 text-navy-900 md:pb-36">
        <div className="site-container">
          <h2 className="font-condensed text-4xl leading-none font-bold uppercase md:text-5xl">{labels.others}</h2>
          <ul className="mt-12 grid gap-x-6 gap-y-14 md:grid-cols-3">
            {site.services
              .filter((s) => s.slug !== service.slug)
              .map((s) => (
                <li key={s.slug}>
                  <ServiceCard service={s} />
                </li>
              ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
