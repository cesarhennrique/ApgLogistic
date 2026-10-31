import type { ReactNode, Ref } from "react";
import images from "@/content/journeyImages.json";
import { type Camera, PHOTO, type View } from "./oceanCamera";

const { widths } = images["navio-mar"];
const src = (w: number, ext: string) => `/images/journey/navio-mar-${w}.${ext}`;
// Up to 1920: the original (6688) is the close's own layer, loaded later, on desktop only.
const base = widths.filter((w) => w <= 1920);
const srcSet = (ext: string) => base.map((w) => `${src(w, ext)} ${w}w`).join(", ");
// Its width at the wide framing: the photo covering the screen.
const SIZES = `(min-aspect-ratio: ${PHOTO.width}/${PHOTO.height}) 100vw, ${((PHOTO.width / PHOTO.height) * 100).toFixed(1)}vh`;
export const ORIGINAL = { avif: src(PHOTO.width, "avif"), webp: src(PHOTO.width, "webp") };

export const viewOf = (stage: HTMLElement): View => ({
  width: stage.clientWidth,
  height: stage.clientHeight,
  dpr: window.devicePixelRatio || 1,
});

// The camera as one transform on the photo's box (its origin at the top left).
export const cameraTransform = ({ x, y, scale }: Camera) =>
  `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(5)})`;

type Props = { photo: Ref<HTMLDivElement>; alt: string; children?: ReactNode };

// Scene 1's still photo (navio-mar) in a box of its own pixel size, placed by the camera (oceanCamera): the hero's
// dive ends on it and scene 1 opens on it, both in the wide framing. No will-change: the browser re-rasters the
// image at each scale, so the close stays sharp.
export function ArrivalPhoto({ photo, alt, children }: Props) {
  return (
    <div
      ref={photo}
      className="absolute top-0 left-0 origin-top-left"
      style={{ width: PHOTO.width, height: PHOTO.height }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSet("avif")} sizes={SIZES} />
        <source type="image/webp" srcSet={srcSet("webp")} sizes={SIZES} />
        <img
          src={src(1920, "webp")}
          width={PHOTO.width}
          height={PHOTO.height}
          alt={alt}
          sizes={SIZES}
          decoding="async"
          // In view under the hero from the start (transparent): lazy keeps it off the LCP's path.
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </picture>
      {children}
    </div>
  );
}
