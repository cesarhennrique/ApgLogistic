import { Loader } from "@/components/intro/Loader";
import { Hero } from "./Hero";
import { JourneyScenes } from "./JourneyScenes";

// The journey (spec §3): the hero (scene 0, the map) and scenes 1–5, desktop's or the phone's (JourneyScenes).
export function Journey() {
  return (
    <div id="journey" className="relative">
      {/* Outside the hero's isolated stacking context, so it can cover the header. */}
      <Loader />
      <Hero />
      <JourneyScenes />
    </div>
  );
}
