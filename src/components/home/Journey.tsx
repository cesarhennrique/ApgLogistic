import { Hero } from "./Hero";
import { JourneyStage } from "./JourneyStage";
import { JourneyTrack } from "./JourneyTrack";

// The hero is chapter 0, so the sticky 3D layer sits behind it and the whole track.
export function Journey() {
  return (
    <div id="journey" className="relative">
      <JourneyStage />
      <Hero />
      <JourneyTrack />
    </div>
  );
}
