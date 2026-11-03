import { Loader } from "@/components/intro/Loader";
import { CraneLift } from "@/components/journey/CraneLift";
import { Distribution } from "@/components/journey/Distribution";
import { Estrada } from "@/components/journey/Estrada";
import { JourneyIndex } from "@/components/journey/JourneyIndex";
import { Load } from "@/components/journey/Load";
import { OceanArrival } from "@/components/journey/OceanArrival";
import { Hero } from "./Hero";

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
      <Distribution />
      <JourneyIndex />
    </div>
  );
}
