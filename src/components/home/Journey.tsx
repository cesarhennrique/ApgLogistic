import { Loader } from "@/components/intro/Loader";
import { OceanArrival } from "@/components/journey/OceanArrival";
import { ScenePlaceholder } from "@/components/journey/ScenePlaceholder";
import { site } from "@/content/site";
import { Hero } from "./Hero";

const scene = (id: (typeof site.journey)[number]["id"]) => site.journey.find((s) => s.id === id)!;

// The journey (spec §3): the hero (scene 0, the 3D map) and scenes 1–6, each a section with its own sticky stage.
export function Journey() {
  return (
    <div id="journey" className="relative">
      {/* Outside the hero's isolated stacking context, so it can cover the header. */}
      <Loader />
      <Hero />
      <OceanArrival />
      <ScenePlaceholder scene={scene("porteiner")} index={3} heightVh={260} background="#fefefe" headerTheme="light" />
      <ScenePlaceholder scene={scene("carga")} index={4} heightVh={220} background="#fefefe" headerTheme="light" />
      <ScenePlaceholder scene={scene("estrada")} index={5} heightVh={300} background="#fefefe" headerTheme="light" />
      <ScenePlaceholder scene={scene("terminal")} index={6} heightVh={300} background="#f3efe7" headerTheme="light" />
      <ScenePlaceholder scene={scene("distribuicao")} index={7} heightVh={300} background="#0a1338" headerTheme="dark" />
    </div>
  );
}
