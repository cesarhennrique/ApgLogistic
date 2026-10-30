"use client";

import { Highway } from "../scene/Highway";
import { Truck } from "../scene/Truck";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.highway;

// Chapter 3 (navy): the truck in profile on the BR-101, the road looping past under it, in light line work.
// shortcut: Prompt 12's road as a drawing; Prompt 13c turns it into the elevation with the red line under the wheels.
export function HighwayStage({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <Highway reducedMotion={reducedMotion} />
      <Truck mode="road" />
    </>
  );
}
