import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";

// Film grain over the placeholder gradient (feTurbulence), until the 3D journey takes the slot.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden bg-linear-to-br from-navy-900 from-35% to-blue-600">
      <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-15 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      {/* Marco 2: the R3F canvas mounts here */}
      <div id="journey-slot" aria-hidden="true" className="absolute inset-0 -z-10" />

      <div className="site-container mt-auto pt-32 pb-16 md:pb-24">
        <ContainerCode index={1} label={site.home.hero.code} />
        <RevealText
          as="h1"
          immediate
          className="font-condensed mt-5 max-w-[9em] text-[clamp(3rem,9vw,9rem)] leading-[0.88] font-bold tracking-[-0.02em] uppercase"
        >
          {site.tagline}
        </RevealText>
        <p className="mt-6 max-w-xl text-lg text-sand-50/80 md:text-xl">{site.home.hero.subtitle}</p>
        <div className="mt-10">
          <CtaButton href="/contato">{site.cta.quote}</CtaButton>
        </div>
      </div>
    </section>
  );
}
