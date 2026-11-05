import type { ReactNode } from "react";
import images from "@/content/journeyImages.json";
import type { SceneImageName } from "@/components/journey/SceneImage";
import { RevealText } from "@/components/motion/RevealText";

// An internal page's hero (spec §4), in the Home hero's pattern without the map: a photo behind (children), a navy
// gradient under the copy (from the bottom on phones, from the left on wide screens) and the header's, the title
// rising line by line (SplitText, RevealText).
export function PageHero({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section data-header-theme="dark" className="relative isolate flex min-h-[78svh] items-end overflow-hidden bg-navy-900 text-sand-50 md:min-h-[86svh]">
      <div className="absolute inset-0 -z-10">{children}</div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-navy-900 via-navy-900/55 to-transparent md:bg-linear-to-r md:from-navy-900/95 md:via-navy-900/50"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-40 bg-linear-to-b from-navy-900/70 to-transparent" />
      <div className="site-container w-full pt-32 pb-14 md:pb-24">
        <RevealText as="h1" immediate className="font-condensed max-w-[14ch] text-6xl leading-[0.9] font-bold uppercase md:text-8xl">
          {title}
        </RevealText>
        {text && <p className="mt-6 max-w-[46ch] text-lg leading-snug text-sand-50/85 md:text-xl">{text}</p>}
      </div>
    </section>
  );
}

const srcSet = (name: string, ext: string) =>
  images[name as SceneImageName].widths.map((w) => `/images/journey/${name}-${w}.${ext} ${w}w`).join(", ");

// A hero's photo covering it (journeyImages, AVIF then WebP), a portrait crop of its own on phones. The page's LCP:
// fetched first.
export function CoverPhoto({ name, phone, alt }: { name: SceneImageName; phone?: SceneImageName; alt: string }) {
  const { width, height, widths } = images[name];
  return (
    <picture>
      {phone && <source media="(max-width: 767px)" type="image/avif" srcSet={srcSet(phone, "avif")} sizes="100vw" />}
      {phone && <source media="(max-width: 767px)" type="image/webp" srcSet={srcSet(phone, "webp")} sizes="100vw" />}
      <source type="image/avif" srcSet={srcSet(name, "avif")} sizes="100vw" />
      <source type="image/webp" srcSet={srcSet(name, "webp")} sizes="100vw" />
      <img
        src={`/images/journey/${name}-${widths[Math.min(2, widths.length - 1)]}.webp`}
        width={width}
        height={height}
        alt={alt}
        fetchPriority="high"
        // the entrance zoom (spec §5, images: 1.08 to 1), as the home's photo; never hidden: it is the LCP
        className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[photo-settle_2.4s_var(--ease-out)_both]"
      />
    </picture>
  );
}
