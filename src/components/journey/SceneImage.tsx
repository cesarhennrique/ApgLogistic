"use client";

import { useRef } from "react";
import images from "@/content/journeyImages.json";
import { useQualityTier } from "@/lib/quality";
import { capSizes } from "@/lib/sizes";
import { useNear } from "./useNear";

export type SceneImageName = keyof typeof images;

type Props = {
  name: SceneImageName;
  alt: string;
  // The rendered width, for the browser to pick a size (e.g. "(min-width: 768px) 45vh, 39vh").
  sizes: string;
  className?: string;
  // Above the fold or first in its scene: fetch eagerly.
  eager?: boolean;
  // Only its own width: for layers that must resample alike (a container over the truck it was cut from).
  full?: boolean;
};

const srcSet = (name: string, widths: number[], ext: string) =>
  widths.map((w) => `/images/journey/${name}-${w}.${ext} ${w}w`).join(", ");

// A journey image (built by `npm run images`): AVIF, then WebP, at 800, 1200 and its own width, with its intrinsic
// size on the <img> so the layout never shifts. On the 'low' tier (lib/quality) its largest width is left out and
// it is picked as if at 2× at most. Unless eager, its source is set only while it is within two screens (useNear):
// past that the <img> stays (its box, its alt) but holds no pixels.
export function SceneImage({ name, alt, sizes: wanted, className, eager = false, full = false }: Props) {
  const img = useRef<HTMLImageElement>(null);
  const near = useNear(img);
  const { width, height } = images[name];
  const all = images[name].widths;
  const tier = useQualityTier();
  const low = tier === "low" && all.length > 1;
  const widths = full ? [width] : low ? all.slice(0, -1) : all;
  const sizes = tier === "low" ? capSizes(wanted, window.devicePixelRatio) : wanted;
  const on = eager || near;
  return (
    <picture>
      <source type="image/avif" srcSet={on ? srcSet(name, widths, "avif") : undefined} sizes={sizes} />
      <source type="image/webp" srcSet={on ? srcSet(name, widths, "webp") : undefined} sizes={sizes} />
      <img
        ref={img}
        src={on ? `/images/journey/${name}-${widths[widths.length - 1]}.webp` : undefined}
        width={width}
        height={height}
        alt={alt}
        sizes={sizes}
        decoding="async"
        loading={eager ? "eager" : "lazy"}
        className={className}
      />
    </picture>
  );
}
