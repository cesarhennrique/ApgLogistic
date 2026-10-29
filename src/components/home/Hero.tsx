import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";
import { HeroStrip } from "./HeroStrip";
import { SeeOperationLink } from "./SeeOperationLink";

// The entrance is the intro timeline's (data-intro="<name>"), after the first-visit loader.
export function Hero() {
  return (
    // Transparent: the stage color and the 3D live in the sticky layer of #journey (JourneyStage).
    <section data-intro-root="" className="relative isolate flex min-h-svh flex-col overflow-hidden">
      <div id="journey-slot" aria-hidden="true" className="absolute inset-0 -z-10" />
      <div className="site-container mt-auto pt-24 pb-8 md:pb-14">
        {/* The map keeps out of this box (CameraRig fits it beside or above). */}
        <div id="hero-copy" className="w-fit max-w-full">
          <div data-intro="code">
            <ContainerCode index={1} label={site.home.hero.code} />
          </div>
          <RevealText
            as="h1"
            manual="title"
            className="font-condensed mt-4 max-w-[20ch] text-[clamp(2.25rem,10vw,3rem)] leading-[0.9] font-bold tracking-[-0.01em] uppercase md:mt-5 md:text-[clamp(2.5rem,6.2vw,6.5rem)]"
          >
            {site.tagline}
          </RevealText>
          <p data-intro="subtitle" className="mt-4 max-w-xl text-base text-sand-50/80 md:mt-6 md:text-xl">
            {site.home.hero.subtitle}
          </p>
          <div data-intro="actions" className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-10">
            <CtaButton href="/contato">{site.cta.quote}</CtaButton>
            <SeeOperationLink />
          </div>
        </div>
      </div>
      <HeroStrip />
    </section>
  );
}
