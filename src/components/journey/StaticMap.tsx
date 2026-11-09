import type { CSSProperties } from "react";
import { site } from "@/content/site";
import { DELIVERIES } from "@/three/models/distributionLayout";
import { HERO_SCALE, MAP_VIEWBOX, ROUTE_STARTS, SALVADOR_HERO, toHero } from "@/three/models/mapUnits";

// The maps as SVG, for the tiers without WebGL (lib/quality): the Northeast's outlines (nordeste-contorno.svg) in map
// units, Suape at the origin, and in red what the canvases draw: the hero's five cabotage routes onto Suape, or the
// distribution's 24 deliveries out of its hubs. Still on the 'static' tier; "animated" on the 'low' one (phones):
// the hero's routes drawn in, a ship along two of them, Suape's pulse (globals.css); the distribution's routes and
// destinations left to its scene, by progress (data-route: pathLength 1, dashed; data-dest).
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

// The hero's frame's shape, and Suape in it (shares of its width and height): for the hero to box it and dive into
// Suape (HeroStage, the SVG map).
export const HERO_FRAME = { aspect: HERO_BOX.w / HERO_BOX.h, suape: { x: -HERO_BOX.x / HERO_BOX.w, y: -HERO_BOX.y / HERO_BOX.h } };

const quad = (from: { x: number; z: number }, to: { x: number; z: number }, bow: number) => {
  const mx = (from.x + to.x) / 2 - (to.z - from.z) * bow;
  const mz = (from.z + to.z) / 2 + (to.x - from.x) * bow;
  return `M${from.x.toFixed(2)} ${from.z.toFixed(2)}Q${mx.toFixed(2)} ${mz.toFixed(2)} ${to.x.toFixed(2)} ${to.z.toFixed(2)}`;
};

export function StaticMap({
  variant,
  fit = false,
  animated = false,
  className = "",
}: {
  variant: "hero" | "distribution";
  fit?: boolean;
  animated?: boolean;
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
          const d = quad(from, { x: 0, z: 0 }, i % 2 ? 0.12 : -0.12);
          return (
            <g key={i}>
              <path
                d={d}
                pathLength={1}
                className={`stroke-red-500/70 ${animated ? "map-route" : ""}`}
                style={animated ? { animationDelay: `${300 + i * 150}ms` } : undefined}
                strokeWidth={0.14}
              />
              {animated && i < 2 && (
                <circle r={0.3} className="fill-sand-50">
                  <animateMotion dur={`${7 + i * 2}s`} begin={`${1.5 + i}s`} repeatCount="indefinite" path={d} />
                </circle>
              )}
            </g>
          );
        })}
      {variant === "distribution" &&
        DELIVERIES.map((d, i) => (
          <g key={i}>
            <path
              data-route={animated ? i : undefined}
              d={quad(d.from, d.to, (i % 2 ? 1 : -1) * 0.16)}
              pathLength={1}
              strokeDasharray={animated ? 1 : undefined}
              strokeDashoffset={animated ? 1 : undefined}
              className="stroke-red-500/80"
              // (its place in the stagger: the phone's journey draws them in by CSS, globals.css)
              style={animated ? ({ "--i": i } as CSSProperties) : undefined}
              strokeWidth={0.1}
            />
            <circle
              data-dest={animated ? i : undefined}
              cx={d.to.x}
              cy={d.to.z}
              r={0.32}
              className="fill-red-500"
              opacity={animated ? 0 : undefined}
              style={animated ? ({ "--i": i } as CSSProperties) : undefined}
            />
          </g>
        ))}
      <circle r={0.9} className={`fill-red-500/30 ${animated ? "map-pulse" : ""}`} />
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
