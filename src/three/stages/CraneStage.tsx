"use client";

import { MathUtils } from "three";
import { journeyProgress } from "../progress";
import { STAGE_CAMERAS } from "./cameras";
import { PortSet } from "./PortSet";

export const keys = STAGE_CAMERAS.crane;

// The drawing builds as the dive from the hero ends (the map has faded by 0.03): edges, then fills, by 0.1.
const BUILD = [0.03, 0.1] as const;
const build = () => MathUtils.clamp((journeyProgress.value - BUILD[0]) / (BUILD[1] - BUILD[0]), 0, 1);

// Chapter 1 (sand): the crane and the ship's bay; the spreader comes down and locks onto the APG box.
// shortcut: the port set as built in Prompts 10–11, in line work; Prompt 13b stages it as an elevation.
export function CraneStage({ reducedMotion }: { reducedMotion: boolean }) {
  return <PortSet reducedMotion={reducedMotion} reveal={reducedMotion ? 1 : build} />;
}
