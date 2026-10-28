import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";

export function Hero() {
  return (
    // Transparent: the gradient and the 3D live in the sticky layer of #journey (JourneyStage).
    <section className="relative isolate flex min-h-svh flex-col overflow-hidden">
      <div id="journey-slot" aria-hidden="true" className="absolute inset-0 -z-10" />
      {/* Legibility: navy 60% held behind the text (the sun's glitter path runs under it), then → 0 below the sun. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-navy-900/60 via-navy-900/60 via-70% to-transparent to-90% md:via-60% md:to-85%"
      />

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
