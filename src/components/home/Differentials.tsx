import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Parallax } from "@/components/motion/Parallax";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { buildDots, parseStates, toHero } from "@/three/models/heroMapLayout";
import { DifferentialsGrid, type PeMap } from "./DifferentialsGrid";

// Pernambuco for the tracking's little map, from the hero's map (built once, at build time): its dots (map units,
// Suape at the origin) and five routes out of Suape to the coverage's towns in PE, there and back.
const svgOf = (lon: number, lat: number) => [(lon + 49) * 100, (2 - lat) * 100] as const;
function peMap(): PeMap {
  const states = parseStates(readFileSync(join(process.cwd(), "public/images/map/nordeste.svg"), "utf8"));
  const { positions } = buildDots({ PE: states.PE }, 9);
  const dots: [number, number][] = [];
  for (let i = 0; i < positions.length; i += 3) dots.push([positions[i], positions[i + 2]]);
  const towns = site.home.coverage.routes.filter((r) => r.from === "Suape" && r.lat > -10).map((r) => toHero(...svgOf(r.lon, r.lat)));
  const leg = (to: { x: number; z: number }, back: boolean) => {
    const [a, b] = back ? [to, { x: 0, z: 0 }] : [{ x: 0, z: 0 }, to];
    const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 - 1.2 };
    return `M${a.x.toFixed(2)} ${a.z.toFixed(2)}Q${mid.x.toFixed(2)} ${mid.z.toFixed(2)} ${b.x.toFixed(2)} ${b.z.toFixed(2)}`;
  };
  const routes = [...towns.map((t) => leg(t, false)), ...towns.slice(0, 2).map((t) => leg(t, true))].slice(0, 5);
  const xs = dots.map((d) => d[0]);
  const zs = dots.map((d) => d[1]);
  return { dots, routes, box: [Math.min(...xs) - 1, Math.min(...zs) - 1, Math.max(...xs) - Math.min(...xs) + 2, Math.max(...zs) - Math.min(...zs) + 2] };
}

// Why APG (spec §4, APGU 1996-08), in the journey's language: navy, the giant word sliding behind, the four numbers
// in a 2×2 of technical grid lines, each with its little picture that plays as it comes in (DifferentialsGrid).
export function Differentials() {
  const copy = site.home.differentials;
  return (
    <section data-header-theme="dark" className="relative isolate overflow-hidden bg-navy-900 py-24 text-sand-50 md:py-32">
      <div aria-hidden="true" className="absolute inset-x-0 top-[18%] -z-10">
        <Parallax axis="x" distance={-220}>
          <p data-decor="" className="font-condensed pl-[4vw] text-[28vw] leading-none font-bold whitespace-nowrap text-navy-800 uppercase md:text-[20vw]">
            {copy.word}
          </p>
        </Parallax>
      </div>
      <div className="site-container">
        <ContainerCode index={homeCode("differentials")} label={copy.code} />
        <h2 className="font-condensed mt-5 text-5xl leading-[0.9] font-bold uppercase md:text-7xl">{copy.title}</h2>
        <DifferentialsGrid pe={peMap()} />
      </div>
    </section>
  );
}
