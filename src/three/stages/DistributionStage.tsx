"use client";

import { Grid } from "../blueprint/Grid";
import { MAP_ORIGIN } from "../models/distributionLayout";
import { Distribution } from "../scene/Distribution";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.distribution;

// Chapter 5 (sand, from above, zooming out): Suape's warehouse on the PE/BA map, the vans fanning out.
// Shifted so Suape sits on the stage's origin.
export function DistributionStage() {
  return (
    <>
      <group position={[-MAP_ORIGIN.x, 0, -MAP_ORIGIN.z]}>
        <Distribution />
      </group>
      <Grid y={-0.1} />
    </>
  );
}
