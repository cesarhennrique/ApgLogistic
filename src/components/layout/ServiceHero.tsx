import { SceneImage, type SceneImageName } from "@/components/journey/SceneImage";
import { TruckShadow } from "@/components/journey/TruckShadow";
import { Parallax } from "@/components/motion/Parallax";
import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import type { Service } from "@/content/site";

// Each service's object on its ground line, as the journey's scenes draw their cut-outs (all shares of the
// picture's own box): the picture and its aspect; where its ground is (the object's base: the crane's legs, the
// tyres, the warehouse's front); its contact shadow; its one dimension (red, fine), and whether its label sits above
// or below the line. The crane fills the hero's height, the truck and the warehouse its width; the warehouse's
// concrete yard fades out to white over its bottom 15% (a cut edge would show).
type Shape = {
  name: SceneImageName;
  aspect: number;
  tall: boolean;
  ground: number;
  shadow: { left: number; width: number; depth: number };
  cota: { x: number; w: number; y: number; above: boolean };
  fade?: boolean;
};
const SHAPES: Record<Service["slug"], Shape> = {
  // porteiner-servico (scripts/build-service-images.mjs): its legs on the bottom edge; the container under the
  // spreader, 40 ft
  "containers-suape": {
    name: "porteiner-servico",
    aspect: 4356 / 4744,
    tall: true,
    ground: 1,
    shadow: { left: 0.5, width: 0.5, depth: 0.03 },
    cota: { x: 0.434, w: 0.169, y: 0.615, above: false },
  },
  // carreta-lado: the tyres' line (craneAnchors' TRUCK_ROAD_Y), its container's box
  "operacao-bahia": {
    name: "carreta-lado",
    aspect: 1672 / 941,
    tall: false,
    ground: 700 / 941,
    shadow: { left: -0.02, width: 1.04, depth: 0.05 },
    cota: { x: 0.221, w: 0.757, y: 0.245, above: true },
  },
  // armazem-docas: the front of the building on the yard, its row of docks under the canopy
  "logistica-armazenagem": {
    name: "armazem-docas",
    aspect: 3344 / 1882,
    tall: false,
    ground: 0.82,
    shadow: { left: 0.02, width: 0.96, depth: 0.06 },
    cota: { x: 0.37, w: 0.585, y: 0.3, above: true },
    fade: true,
  },
};

// A dimension: a fine red line with its two end ticks, its label above or below it.
function Cota({ x, w, y, above, label }: Shape["cota"] & { label: string }) {
  return (
    <div aria-hidden="true" className="absolute" style={{ left: `${x * 100}%`, width: `${w * 100}%`, top: `${y * 100}%` }}>
      <i className="absolute inset-x-0 top-0 h-px bg-red-500" />
      <i className="absolute -top-1 left-0 h-2.5 w-px bg-red-500" />
      <i className="absolute -top-1 right-0 h-2.5 w-px bg-red-500" />
      <span
        className={`absolute left-1/2 -translate-x-1/2 bg-[#fefefe] px-1.5 font-mono text-xs whitespace-nowrap text-red-500 ${above ? "bottom-1.5" : "top-1.5"}`}
      >
        {label}
      </span>
    </div>
  );
}

// A service page's hero (spec §4), light like the journey's scenes, where its cut-out belongs: the service's code,
// the title rising line by line (navy), its line (navy/70); behind, the giant word sliding slowly with the scroll; the
// object standing on a navy ground line, its contact shadow and its dimension drawn. The header goes navy over it.
export function ServiceHero({ service }: { service: Service }) {
  const shape = SHAPES[service.slug];
  // the object's box, its ground on the ground line (a translate by the share under its ground)
  const box = (
    <div
      className={`relative ${shape.tall ? "h-full" : "w-full"}`}
      style={{ aspectRatio: shape.aspect, transform: `translateY(${((1 - shape.ground) * 100).toFixed(2)}%)` }}
    >
      <TruckShadow y={shape.ground} {...shape.shadow} />
      <SceneImage
        name={shape.name}
        alt=""
        eager
        sizes={shape.tall ? "(min-width: 768px) 46vh, 40vh" : "(min-width: 768px) 50vw, 92vw"}
        className={`relative h-full w-full ${shape.fade ? "mask-[linear-gradient(to_bottom,black_85%,transparent)]" : ""}`}
      />
      <Cota {...shape.cota} label={service.cota} />
    </div>
  );
  return (
    <section
      data-header-theme="light"
      className="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#fefefe] pb-[10svh] text-navy-900 md:block md:pb-0"
    >
      {/* The giant word behind, sliding against the scroll (phones: behind the object, clear of the copy). */}
      <div aria-hidden="true" className="absolute inset-x-0 top-[58%] -z-10 md:top-1/2 md:-translate-y-1/2">
        <Parallax axis="x" distance={-160}>
          <p className="font-condensed pl-[4vw] text-[30vw] leading-none font-bold whitespace-nowrap text-[#EDEBE6] uppercase md:text-[22vw]">
            {service.word}
          </p>
        </Parallax>
      </div>
      <div className="site-container relative pt-24 md:pt-36">
        <div className="md:max-w-[40%]">
          <ContainerCode index={homeCode("services")} label={service.title} />
          <RevealText as="h1" immediate className="font-condensed mt-4 text-6xl leading-[0.9] font-bold uppercase md:text-[clamp(3.5rem,5.4vw,6rem)]">
            {service.title}
          </RevealText>
          <p className="mt-6 max-w-[42ch] text-lg leading-snug text-navy-900/70">{service.summary}</p>
        </div>
      </div>
      {/* The object on the ground line (phones: under the copy, the rest of the screen; wide screens: right of it). */}
      <div className="relative mt-8 min-h-[34svh] flex-1 md:absolute md:top-32 md:right-[4vw] md:bottom-[12svh] md:left-[44%] md:mt-0">
        <div className={`absolute inset-x-4 bottom-0 flex items-end justify-center md:inset-x-0 ${shape.tall ? "top-0" : ""}`}>{box}</div>
      </div>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-[10svh] h-px bg-navy-900/35 md:bottom-[12svh]" />
    </section>
  );
}
