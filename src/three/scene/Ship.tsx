"use client";

import { SHIP_POSITION } from "../anchors";
import { BlueprintMesh, type Reveal } from "../blueprint/BlueprintMesh";
import { buildShipGeometry } from "../models/shipGeometry";
import { ContainerStacks } from "./ContainerStacks";

const ship = buildShipGeometry();

// The feeder, docked under the crane's boom, in line work: hull, deck and hatches, the house and its funnel in the
// main stroke; mast and window bands in the secondary one.
export function Ship({ reveal }: { reveal?: Reveal }) {
  return (
    <group position={SHIP_POSITION}>
      {/* The model's bow is at -Z; turned around it heads +Z, with its superstructure at the far end. */}
      <group rotation-y={Math.PI}>
        <BlueprintMesh geometry={ship.hull} reveal={reveal} />
        <BlueprintMesh geometry={ship.deck} reveal={reveal} />
        <BlueprintMesh geometry={ship.hatches} reveal={reveal} />
        <BlueprintMesh geometry={ship.superstructure} reveal={reveal} />
        <BlueprintMesh geometry={ship.funnel} reveal={reveal} />
        <BlueprintMesh geometry={ship.mast} weight="secondary" reveal={reveal} />
        <BlueprintMesh geometry={ship.windows} weight="secondary" reveal={reveal} />
      </group>
      {/* The stacks are laid out in the port's frame: undo the berth offset. */}
      <group position={[-SHIP_POSITION.x, -SHIP_POSITION.y, -SHIP_POSITION.z]}>
        <ContainerStacks areas={["ship"]} reveal={reveal} />
      </group>
    </group>
  );
}
