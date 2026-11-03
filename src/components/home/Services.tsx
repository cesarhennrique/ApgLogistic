import { existsSync } from "node:fs";
import { join } from "node:path";
import { Container, Truck, Warehouse, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site, type Service } from "@/content/site";

const icons: Record<Service["slug"], LucideIcon> = {
  "containers-suape": Container,
  "operacao-bahia": Truck,
  "logistica-armazenagem": Warehouse,
};

// Runs at build time (SSG): a photo replaces the icon block as soon as the file lands in public/.
const imageFor = (slug: string) =>
  existsSync(join(process.cwd(), "public/images/services", `${slug}.webp`)) ? `/images/services/${slug}.webp` : null;

const ZOOM = "transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none";

function ServiceCard({ service }: { service: Service }) {
  const image = imageFor(service.slug);
  const Icon = icons[service.slug];
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-blue-600 md:aspect-[4/5]">
        {image ? (
          <Image src={image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className={`object-cover ${ZOOM}`} />
        ) : (
          <div className={`grid h-full place-items-center text-sand-50 ${ZOOM}`}>
            <Icon aria-hidden="true" strokeWidth={1} className="size-28 md:size-32" />
          </div>
        )}
        {/* Marco 2: 3D miniature of the operation */}
        <div data-mini3d={service.slug} aria-hidden="true" className="absolute inset-0" />
      </div>
      <h3 className="font-condensed mt-6 text-4xl leading-none font-bold uppercase">
        {/* stretched link: the whole card is the target */}
        <TransitionLink
          href={`/servicos/${service.slug}`}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-navy-900"
        >
          {service.title}
        </TransitionLink>
      </h3>
      <p className="mt-3 text-navy-900/75">{service.summary}</p>
      <span aria-hidden="true" className="mt-auto inline-flex items-center gap-3 pt-6 text-sm font-semibold tracking-wide uppercase">
        {site.home.services.more}
        <span className="mask-arrow h-[0.72em] w-[1.6em] bg-red-500 transition-transform duration-150 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />
      </span>
    </article>
  );
}

export function Services() {
  return (
    // It slides up over the distribution's last screen, held for it (not with reduced motion: then it simply follows).
    <section data-surface="light" data-header-theme="light" className="relative z-10 bg-sand-50 py-24 text-navy-900 motion-safe:-mt-[100svh] md:py-36">
      <div className="site-container">
        <ContainerCode index={homeCode("services")} label={site.home.services.code} />
        <h2 className="font-condensed mt-5 text-5xl leading-[0.9] font-bold uppercase md:text-7xl">
          {site.home.services.title}
        </h2>
        <ul className="mt-14 grid gap-x-6 gap-y-14 md:mt-20 md:grid-cols-3">
          {site.services.map((s) => (
            <li key={s.slug}>
              <ServiceCard service={s} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
