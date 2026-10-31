import { Loader } from "@/components/intro/Loader";
import { CraneLift } from "@/components/journey/CraneLift";
import { Estrada } from "@/components/journey/Estrada";
import { Load } from "@/components/journey/Load";
import { OceanArrival } from "@/components/journey/OceanArrival";
import { ScenePlaceholder } from "@/components/journey/ScenePlaceholder";
import { site } from "@/content/site";
import { Hero } from "./Hero";

const scene = (id: (typeof site.journey)[number]["id"]) => site.journey.find((s) => s.id === id)!;

// The journey (spec §3): the hero (scene 0, the 3D map) and scenes 1–5, each a section with its own sticky stage.
export function Journey() {
  return (
    <div id="journey" className="relative">
      {/* Outside the hero's isolated stacking context, so it can cover the header. */}
      <Loader />
      <Hero />
      <OceanArrival />
      <CraneLift />
      <Load />
      <Estrada />
      <ScenePlaceholder scene={scene("distribuicao")} heightVh={300} background="#0a1338" headerTheme="dark" />
    </div>
  );
}
