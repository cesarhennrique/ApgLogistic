import { site } from "@/content/site";
import { DELIVERIES } from "@/three/models/distributionLayout";
import { HERO_SCALE, MAP_VIEWBOX, ROUTE_STARTS, SALVADOR_HERO, toHero } from "@/three/models/mapUnits";

// The maps as still pictures, for the 'static' tier (no WebGL, or reduced motion: lib/quality): the Northeast's
// outlines (nordeste-contorno.svg) in map units, Suape at the origin, and in red what the
// canvases draw: the hero's five cabotage routes onto Suape, or the distribution's 24 deliveries out of its hubs.
// "fit": scaled to its box (the hero); otherwise one map unit a px, Suape at the box's top left, for a camera to
// place (scene 5's).
const topLeft = toHero(MAP_VIEWBOX.x, MAP_VIEWBOX.y);
const size = { w: MAP_VIEWBOX.w * HERO_SCALE, h: MAP_VIEWBOX.h * HERO_SCALE };
// the hero's frame: the map and the routes offshore, east of Suape
const HERO_BOX = {
  x: topLeft.x - 1,
  y: topLeft.z - 1,
  w: size.w + 14,
  h: size.h + 2,
};

const quad = (from: { x: number; z: number }, to: { x: number; z: number }, bow: number) => {
  const mx = (from.x + to.x) / 2 - (to.z - from.z) * bow;
  const mz = (from.z + to.z) / 2 + (to.x - from.x) * bow;
  return `M${from.x.toFixed(2)} ${from.z.toFixed(2)}Q${mx.toFixed(2)} ${mz.toFixed(2)} ${to.x.toFixed(2)} ${to.z.toFixed(2)}`;
};

export function StaticMap({
  variant,
  fit = false,
  className = "",
}: {
  variant: "hero" | "distribution";
  fit?: boolean;
  className?: string;
}) {
  const box = fit ? HERO_BOX : { x: topLeft.x, y: topLeft.z, w: size.w, h: size.h };
  const label = "font-mono fill-sand-50 tracking-[0.16em]";
  return (
    <svg
      data-static-map={variant}
      aria-hidden="true"
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      className={`overflow-visible ${className}`}
      style={
        fit
          ? undefined
          : {
              position: "absolute",
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
            }
      }
      fill="none"
    >
      {/* the outlines (nordeste-contorno.svg: nordeste.svg with its states drawn as lines, PE and BA lit) */}
      <image
        href="/images/map/nordeste-contorno.svg"
        x={topLeft.x}
        y={topLeft.z}
        width={size.w}
        height={size.h}
       
      />
      {variant === "hero" &&
        ROUTE_STARTS.map(([bearing, distance], i) => {
          const a = (bearing * Math.PI) / 180;
          const from = { x: Math.cos(a) * distance, z: Math.sin(a) * distance };
          return (
            <path
              key={i}
              d={quad(from, { x: 0, z: 0 }, i % 2 ? 0.12 : -0.12)}
              className="stroke-red-500/70"
              strokeWidth={0.14}
            />
          );
        })}
      {variant === "distribution" &&
        DELIVERIES.map((d, i) => (
          <g key={i}>
            <path d={quad(d.from, d.to, (i % 2 ? 1 : -1) * 0.16)} className="stroke-red-500/80" strokeWidth={0.1} />
            <circle cx={d.to.x} cy={d.to.z} r={0.32} className="fill-red-500" />
          </g>
        ))}
      <circle r={0.9} className="fill-red-500/30" />
      <circle r={0.45} className="fill-red-500" />
      <circle cx={SALVADOR_HERO.x} cy={SALVADOR_HERO.z} r={0.35} className="fill-red-500" />
      {variant === "hero" && (
        <text x={1.4} y={-0.9} className={label} fontSize={1.5}>
          {site.journeyScene.mapLabels.suape}
        </text>
      )}
      {variant === "hero" && (
        <text x={SALVADOR_HERO.x + 1.2} y={SALVADOR_HERO.z + 0.4} className={label} fontSize={1.5}>
          {site.journeyScene.mapLabels.salvador}
        </text>
      )}
    </svg>
  );
}
