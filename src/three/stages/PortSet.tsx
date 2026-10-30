"use client";

import { CRANE_POSITION } from "../anchors";
import type { Reveal } from "../blueprint/BlueprintMesh";
import { Grid } from "../blueprint/Grid";
import { Crane } from "../scene/Crane";
import { Ship } from "../scene/Ship";
import { Truck } from "../scene/Truck";

// The port as one drawing (quay, crane, the docked ship's bay, the APG truck in the lane), shifted so the crane's
// base sits on the stage's origin. Both the crane and the load chapters stage it.
export function PortSet({ reducedMotion, reveal }: { reducedMotion: boolean; reveal?: Reveal }) {
  return (
    <group position={[-CRANE_POSITION.x, -CRANE_POSITION.y, -CRANE_POSITION.z]}>
      <Crane reducedMotion={reducedMotion} reveal={reveal} />
      <Ship reveal={reveal} />
      <Truck mode="port" reveal={reveal} />
      {/* At the waterline. */}
      <Grid />
    </group>
  );
}
