"use client";

import { ContactShadows } from "@react-three/drei";
import { CRANE_POSITION, QUAY_EDGE_X } from "../anchors";
import { Crane } from "../scene/Crane";
import { Ship } from "../scene/Ship";
import { Truck } from "../scene/Truck";

// The port as one studio set (quay, crane, the docked ship's bay, the APG truck in the lane), shifted so the
// crane's base sits on the stage's origin. Both the crane and the load chapters stage it.
export function PortSet({ reducedMotion, active }: { reducedMotion: boolean; active: boolean }) {
  return (
    <>
      <group position={[-CRANE_POSITION.x, -CRANE_POSITION.y, -CRANE_POSITION.z]}>
        <Crane reducedMotion={reducedMotion} />
        <Ship />
        <Truck mode="port" />
      </group>
      {/* Soft contact shadow on the quay deck (its top is the stage's y = 0). */}
      {active && (
        <ContactShadows
          position={[QUAY_EDGE_X - CRANE_POSITION.x + 33, 0.01, -17]}
          scale={100}
          resolution={512}
          far={30}
          blur={2.4}
          opacity={0.45}
          color="#1a1d26"
        />
      )}
    </>
  );
}
