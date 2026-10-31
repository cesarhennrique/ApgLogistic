import { preload } from "react-dom";
import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";
import { HeroStage } from "./HeroStage";
import { HeroStrip } from "./HeroStrip";
import { SeeOperationLink } from "./SeeOperationLink";

// Scene 0, 320vh: 120vh of scroll for the hero's exit (the copy and the map leave, the photo pushes in on the
// ship), then 100vh while scene 1 slides in over it (scene 1 overlaps the hero's last screen), then the screen it
// covers.
const HERO_VH = 320;

// The photo (the LCP): the full frame on wide screens, a portrait crop on the bow and the cranes on phones
// (scripts/build-journey-images.mjs).
const photo = (name: string, ext: string) => `/images/journey/${name}.${ext}`;
const WIDE = [1200, 1920, 2560, 3840];
const wideSet = (ext: string) => WIDE.map((w) => `${photo(`hero-porto-${w}`, ext)} ${w}w`).join(", ");
// Its width when it covers the screen (3840×1645).
const SIZES = "(min-aspect-ratio: 3840/1645) 100vw, 233.4vh";
const PHONE = "(max-width: 767px)";
const WIDE_MEDIA = "(min-width: 768px)";

function HeroPhoto() {
  return (
    <picture>
      <source media={PHONE} type="image/avif" srcSet={photo("hero-porto-mobile-760", "avif")} />
      <source media={PHONE} type="image/webp" srcSet={photo("hero-porto-mobile-760", "webp")} />
      <source type="image/avif" srcSet={wideSet("avif")} sizes={SIZES} />
      <source type="image/webp" srcSet={wideSet("webp")} sizes={SIZES} />
      <img
        src={photo("hero-porto-1920", "webp")}
        alt={site.home.hero.photoAlt}
        fetchPriority="high"
        // the ship in focus: its deck at the frame's right third
        className="absolute inset-0 h-full w-full object-cover object-[68%_55%] max-md:object-center"
      />
    </picture>
  );
}

// The entrance is the intro timeline's (data-intro="<name>"), after the first-visit loader.
export function Hero() {
  const { title } = site.home.hero;
  // The LCP, fetched first: React puts these at the top of the head, before the scripts.
  preload(photo("hero-porto-mobile-760", "avif"), { as: "image", type: "image/avif", media: PHONE, fetchPriority: "high" });
  preload(photo("hero-porto-1920", "avif"), {
    as: "image",
    type: "image/avif",
    media: WIDE_MEDIA,
    imageSrcSet: wideSet("avif"),
    imageSizes: SIZES,
    fetchPriority: "high",
  });
  return (
    <section id="hero" data-intro-root="" data-header-theme="dark" className="relative bg-navy-900" style={{ height: `${HERO_VH}vh` }}>
      <HeroStage photo={<HeroPhoto />}>
        {/* Phones: at the bottom, over the photo's darker foot; wide screens: centred at the left, over the sea. */}
        <div className="site-container flex flex-1 flex-col pt-20 pb-6 max-md:justify-end md:justify-center md:pt-24">
          {/* The map keeps out of this box (CameraRig fits it in the sky). */}
          <div id="hero-copy" className="w-fit max-w-full">
            <div data-intro="code">
              <ContainerCode index={homeCode("hero")} label={site.home.hero.code} tone="opacity-100" />
            </div>
            <RevealText
              as="h1"
              manual="title"
              lines={[...title.lines.map((text) => ({ text })), { text: title.accent, className: "text-red-500" }]}
              className="font-condensed mt-4 text-[clamp(2.5rem,11vw,3.5rem)] leading-[0.88] font-bold tracking-[-0.01em] uppercase md:mt-5 md:text-[clamp(3rem,7vw,7rem)]"
            >
              {site.tagline}
            </RevealText>
            <p data-intro="subtitle" className="mt-4 max-w-md text-base text-sand-50/85 md:mt-6 md:max-w-xl md:text-xl">
              {site.home.hero.subtitle}
            </p>
            <div data-intro="actions" className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 md:mt-10">
              <CtaButton href="/contato">{site.cta.quote}</CtaButton>
              <SeeOperationLink />
            </div>
          </div>
        </div>
        <HeroStrip />
      </HeroStage>
    </section>
  );
}
