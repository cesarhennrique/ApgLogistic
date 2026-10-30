"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { type Group, Matrix4, Vector3 } from "three";
import { TRAILER_BED_HEIGHT, TRUCK_LOAD_POINT } from "../anchors";
import { BlueprintMesh, type Reveal } from "../blueprint/BlueprintMesh";
import { RED_TONE } from "../blueprint/ink";
import { LIFT_DONE } from "../craneMotion";
import { HIGHWAY } from "../models/highwayLayout";
import { WHEEL_Y, WHEELS, buildTruckGeometry } from "../models/truckGeometry";
import { journeyProgress } from "../progress";
import { ApgBox } from "./ContainerStacks";

const truck = buildTruckGeometry();
const wheelMatrices = WHEELS.map(([x, z]) => new Matrix4().makeTranslation(x, WHEEL_Y, z));

export type TruckMode = "port" | "road";
// On the highway stage: the truck lane, wheels on the road.
const ROAD_POINT = new Vector3(0, HIGHWAY.roadY + TRAILER_BED_HEIGHT, HIGHWAY.truckLaneZ);

// The APG tractor and skeletal trailer, in line work. "port": parked in the crane's lane, cab toward -Z; the box
// appears on its twist locks the moment it lands (0.4). "road": on the highway stage in profile, heading +X,
// loaded. Body, chassis and trailer in the main stroke; trim (band, glass, lamps, skirts) in the secondary one;
// the logo's arrow solid red.
export function Truck({ mode, reveal }: { mode: TruckMode; reveal?: Reveal }) {
  const box = useRef<Group>(null);
  const place = useMemo(
    () => (mode === "port" ? { position: TRUCK_LOAD_POINT, yaw: Math.PI } : { position: ROAD_POINT, yaw: Math.PI / 2 }),
    [mode],
  );

  useFrame(() => {
    // From the moment it lands the box is the truck's: the crane hides its own copy.
    if (mode === "port") box.current!.visible = journeyProgress.value >= LIFT_DONE;
  });

  return (
    <group position={place.position} rotation-y={place.yaw}>
      <BlueprintMesh geometry={truck.cab} reveal={reveal} />
      <BlueprintMesh geometry={truck.deflector} reveal={reveal} />
      <BlueprintMesh geometry={truck.dark} reveal={reveal} />
      <BlueprintMesh geometry={truck.metal} reveal={reveal} />
      <BlueprintMesh geometry={truck.trailer} reveal={reveal} />
      <BlueprintMesh geometry={truck.tire} matrices={wheelMatrices} reveal={reveal} />
      <BlueprintMesh geometry={truck.rim} matrices={wheelMatrices} weight="secondary" reveal={reveal} />
      {[truck.paint, truck.navy, truck.glass, truck.headlights, truck.amber].map((g) => (
        <BlueprintMesh key={g.uuid} geometry={g} weight="secondary" reveal={reveal} />
      ))}
      <BlueprintMesh geometry={truck.red} tone={RED_TONE} reveal={reveal} />
      <group ref={box} visible={mode === "road"}>
        <ApgBox reveal={reveal} />
      </group>
    </group>
  );
}
