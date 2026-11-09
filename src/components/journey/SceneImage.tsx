"use client";

import { useEffect, useRef, useState } from "react";
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
// it is picked as if at 2× at most. Unless eager, its source is set only while its scene is near (useNear): far, the
// <img> stays (its box, its alt) but holds no pixels; it shows only once decoded (the scene's colour under it till
// then: no frame ever decodes it, nor shows it half drawn).
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
  const [decoded, setDecoded] = useState(false);
  useEffect(() => {
    const el = img.current!;
    if (!on || eager) return;
    let live = true;
    const go = () => void el.decode().then(() => live && setDecoded(true), () => live && setDecoded(true));
    if (el.complete && el.naturalWidth) go();
    else el.addEventListener("load", go, { once: true });
    return () => {
      live = false;
      el.removeEventListener("load", go);
      setDecoded(false);
    };
  }, [on, eager]);
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
        style={eager || decoded ? undefined : { opacity: 0 }}
      />
    </picture>
  );
}
