"use client";

import { STAGE_CAMERAS } from "./cameras";
import { PortSet } from "./PortSet";

export const keys = STAGE_CAMERAS.load;

// Chapter 2 (sand studio): the camera turns to the truck's profile as the box crosses and lands on the trailer.
// shortcut: the same port set as chapter 1; Prompt 13b dresses the studio.
export function LoadStage(props: { reducedMotion: boolean; active: boolean }) {
  return <PortSet {...props} />;
}
