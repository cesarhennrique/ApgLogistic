import images from "@/content/journeyImages.json";

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
// size on the <img> so the layout never shifts.
export function SceneImage({ name, alt, sizes, className, eager = false, full = false }: Props) {
  const { width, height } = images[name];
  const widths = full ? [width] : images[name].widths;
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet(name, widths, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(name, widths, "webp")} sizes={sizes} />
      <img
        src={`/images/journey/${name}-${widths[widths.length - 1]}.webp`}
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
