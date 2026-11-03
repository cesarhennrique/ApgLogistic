import { SceneImage, type SceneImageName } from "@/components/journey/SceneImage";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site, type Service } from "@/content/site";

// Each service's cut-out, in the journey's pattern (journeyImages, AVIF then WebP): the crane's spreader with the
// container (scripts/build-service-images.mjs), the loaded truck, the warehouse and its docks. Its box: 4:3 on
// phones, 4:5 from md; the portrait crop fills it, the landscape ones sit whole in it (the warehouse's yard fading
// out over its bottom 15%: a cut edge would show).
const SERVICE_IMAGES: Record<Service["slug"], { name: SceneImageName; fill: boolean; fade?: boolean }> = {
  "containers-suape": { name: "servico-containers-suape", fill: true },
  "operacao-bahia": { name: "carreta-lado", fill: false },
  "logistica-armazenagem": { name: "armazem-docas", fill: false, fade: true },
};

// Hover, with a fine pointer only and not with reduced motion: the picture lifts 6 px and grows 3%.
const LIFT =
  "transition-transform duration-240 ease-out motion-safe:pointer-fine:group-hover:-translate-y-1.5 motion-safe:pointer-fine:group-hover:scale-[1.03]";

export function ServiceCard({ service }: { service: Service }) {
  const image = SERVICE_IMAGES[service.slug];
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#fefefe] md:aspect-[4/5]">
        <div className={`absolute inset-0 ${LIFT} ${image.fill ? "" : "grid place-items-center px-5"}`}>
          <SceneImage
            name={image.name}
            alt=""
            sizes="(min-width: 1440px) 440px, (min-width: 768px) 31vw, 92vw"
            className={`${image.fill ? "h-full w-full object-cover" : "h-auto w-full"} ${image.fade ? "mask-[linear-gradient(to_bottom,black_85%,transparent)]" : ""}`}
          />
        </div>
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
