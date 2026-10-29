"use client";

import { ContactShadows } from "@react-three/drei";
import { HIGHWAY } from "../models/highwayLayout";
import { Highway } from "../scene/Highway";
import { Truck } from "../scene/Truck";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.highway;

// Chapter 3 (navy): the truck in profile on the BR-101 at night, the road looping past under it.
// shortcut: Prompt 12's road; Prompt 13c turns it into the dark band with the red line under the wheels.
export function HighwayStage({ reducedMotion, active }: { reducedMotion: boolean; active: boolean }) {
  return (
    <>
      <Highway reducedMotion={reducedMotion} />
      <Truck mode="road" />
      {active && (
        <ContactShadows
          position={[2, HIGHWAY.roadY + 0.01, HIGHWAY.truckLaneZ]}
          scale={30}
          resolution={512}
          far={6}
          blur={2}
          opacity={0.6}
        />
      )}
    </>
  );
}
