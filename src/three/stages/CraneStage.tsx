"use client";

import { STAGE_CAMERAS } from "./cameras";
import { PortSet } from "./PortSet";

export const keys = STAGE_CAMERAS.crane;

// Chapter 1 (sand studio): the crane and the ship's bay; the spreader comes down and locks onto the APG box.
// shortcut: the port set as built in Prompts 10–11; Prompt 13b dresses the studio.
export function CraneStage(props: { reducedMotion: boolean; active: boolean }) {
  return <PortSet {...props} />;
}
