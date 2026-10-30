"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { BoxGeometry, BufferAttribute, BufferGeometry, type Group, LineBasicMaterial } from "three";
import { CRANE_POSITION, QUAY_EDGE_X, QUAY_TOP, SHIP_PICK_POINT } from "../anchors";
import { BlueprintMesh, type Reveal, readReveal } from "../blueprint/BlueprintMesh";
import { ink } from "../blueprint/ink";
import { craneState, LIFT_DONE } from "../craneMotion";
import { CONTAINER } from "../models/containerGeometry";
import { buildCraneGeometry, buildSpreaderGeometry, buildTrolleyGeometry, CRANE } from "../models/craneGeometry";
import { journeyProgress } from "../progress";
import { ApgBox, ContainerStacks } from "./ContainerStacks";

const crane = buildCraneGeometry();
const trolley = buildTrolleyGeometry();
const spreader = buildSpreaderGeometry(CONTAINER["40"].length);

// The quay: a slab from the edge inland, its top at QUAY_TOP.
const QUAY = { x0: QUAY_EDGE_X, x1: QUAY_EDGE_X + 66, z0: CRANE_POSITION.z - 64, z1: CRANE_POSITION.z + 30 };
const quay = new BoxGeometry(QUAY.x1 - QUAY.x0, QUAY_TOP + 4, QUAY.z1 - QUAY.z0).translate(
  (QUAY.x0 + QUAY.x1) / 2,
  (QUAY_TOP - 4) / 2,
  (QUAY.z0 + QUAY.z1) / 2,
);
// The hoist ropes: hairlines in the stroke's secondary ink.
const ropeMaterial = new LineBasicMaterial({ transparent: true });

// Four hoist ropes, trolley to headblock: rewritten every frame so they stretch with the hoist.
const ROPES = [
  [-0.9, -2.2],
  [0.9, -2.2],
  [-0.9, 2.2],
  [0.9, 2.2],
];
const ropes = new BufferGeometry();
ropes.setAttribute("position", new BufferAttribute(new Float32Array(ROPES.length * 6), 3));

// The spreader's "clack" as it seats: scale 1 → 0.98 → 1 over 120 ms.
const CLACK = 0.12;

const state = craneState(0);
export function Crane({ reducedMotion, reveal }: { reducedMotion: boolean; reveal?: Reveal }) {
  const trolleyRef = useRef<Group>(null);
  const spreaderRef = useRef<Group>(null);
  const boxRef = useRef<Group>(null);
  // null until the first frame, so loading straight into a locked state (?p=0.15) doesn't clack.
  const wasLocked = useRef<boolean | null>(null);
  const clackAt = useRef(-Infinity);

  useFrame(({ clock }) => {
    craneState(journeyProgress.value, state);
    const { trolleyX, spreaderY, container, locked } = state;

    trolleyRef.current!.position.x = trolleyX - CRANE_POSITION.x;
    spreaderRef.current!.position.set(trolleyX, spreaderY, CRANE_POSITION.z);
    // Landed (0.4): the truck carries its own copy from here.
    boxRef.current!.visible = journeyProgress.value < LIFT_DONE;
    boxRef.current!.position.copy(container);

    if (wasLocked.current === false && locked && !reducedMotion) clackAt.current = clock.elapsedTime;
    wasLocked.current = locked;
    const t = (clock.elapsedTime - clackAt.current) / CLACK;
    spreaderRef.current!.scale.setScalar(t >= 0 && t < 1 ? 1 - 0.02 * Math.sin(Math.PI * t) : 1);

    const pos = ropes.attributes.position as BufferAttribute;
    const top = CRANE_POSITION.y + CRANE.trolleyY - 0.7;
    ROPES.forEach(([dx, dz], i) => {
      pos.setXYZ(i * 2, trolleyX + dx, top, CRANE_POSITION.z + dz);
      pos.setXYZ(i * 2 + 1, trolleyX + dx * 0.8, spreaderY + 0.9, CRANE_POSITION.z + dz * 0.45);
    });
    pos.needsUpdate = true;
    ropeMaterial.color.copy(ink.stroke.value);
    ropeMaterial.opacity = ink.secondary.value * Math.min(readReveal(reveal) / 0.6, 1);
  });

  return (
    <group>
      <BlueprintMesh geometry={quay} reveal={reveal} />
      <group position={CRANE_POSITION}>
        <BlueprintMesh geometry={crane.structure} reveal={reveal} />
        <BlueprintMesh geometry={crane.house} reveal={reveal} />
        <BlueprintMesh ref={trolleyRef} geometry={trolley} position-y={CRANE.trolleyY} reveal={reveal} />
      </group>
      <BlueprintMesh ref={spreaderRef} geometry={spreader} reveal={reveal} />
      <lineSegments geometry={ropes} material={ropeMaterial} frustumCulled={false} />

      {/* The APG box the crane moves: from the ship's bay to the trailer. */}
      <group ref={boxRef} position={SHIP_PICK_POINT}>
        <ApgBox reveal={reveal} />
      </group>

      <ContainerStacks areas={["port"]} reveal={reveal} />
    </group>
  );
}
