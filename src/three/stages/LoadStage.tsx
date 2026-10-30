"use client";

import { STAGE_CAMERAS } from "./cameras";
import { PortSet } from "./PortSet";

export const keys = STAGE_CAMERAS.load;

// Chapter 2 (sand): the camera turns to the truck's profile as the box crosses and lands on the trailer.
// shortcut: the same port set as chapter 1, already built; Prompt 13b stages it as an elevation.
export function LoadStage({ reducedMotion }: { reducedMotion: boolean }) {
  return <PortSet reducedMotion={reducedMotion} />;
}
