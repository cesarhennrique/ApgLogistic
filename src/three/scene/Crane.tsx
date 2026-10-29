"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  type Group,
  LineBasicMaterial,
  type Mesh,
  MeshStandardMaterial,
} from "three";
import { CRANE_POSITION, QUAY_EDGE_X, QUAY_TOP, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "../anchors";
import { craneState, LIFT_DONE } from "../craneMotion";
import { CONTAINER, getContainerGeometry, getStripeGeometry } from "../models/containerGeometry";
import { buildCraneGeometry, buildSpreaderGeometry, buildTrolleyGeometry, CRANE } from "../models/craneGeometry";
import { journeyProgress } from "../progress";
import { createConcreteMaterial } from "./concrete";
import { apgBoxMaterial, ContainerStacks, stripeMaterial } from "./ContainerStacks";

const crane = buildCraneGeometry();
const trolley = buildTrolleyGeometry();
const spreader = buildSpreaderGeometry(CONTAINER["40"].length);

// Light grey steel; the studio's rim light draws its silhouette.
const steel = new MeshStandardMaterial({ color: "#c9ccd1", roughness: 0.55, metalness: 0.35 });
// Sand details (machinery house, boom head) and the A-frame's red obstruction lights.
const house = new MeshStandardMaterial({ color: "#d8c8a6", roughness: 0.65, metalness: 0.1 });
const navLights = new MeshStandardMaterial({ color: "#3a0d0a", emissive: "#ff2a1a", emissiveIntensity: 4, roughness: 0.4 });
const dark = new MeshStandardMaterial({ color: "#30353f", roughness: 0.5, metalness: 0.3 });
const spreaderPaint = new MeshStandardMaterial({ color: "#c99a3a", roughness: 0.5, metalness: 0.3 });
const ropeMaterial = new LineBasicMaterial({ color: "#1c1f26" });

// Quay: from the edge inland, painted with the edge safety line and the crane's truck lane.
const QUAY = { x0: QUAY_EDGE_X, x1: QUAY_EDGE_X + 66, z0: CRANE_POSITION.z - 64, z1: CRANE_POSITION.z + 30 };
const laneX = [TRUCK_LOAD_POINT.x - 3, TRUCK_LOAD_POINT.x + 3];
const quayMaterial = createConcreteMaterial({
  solids: [{ from: [QUAY_EDGE_X + 1.5, QUAY.z0], to: [QUAY_EDGE_X + 1.5, QUAY.z1] }],
  dashes: laneX.map((x) => ({ from: [x, QUAY.z0] as [number, number], to: [x, QUAY.z1] as [number, number] })),
});

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
export function Crane({ reducedMotion }: { reducedMotion: boolean }) {
  const trolleyRef = useRef<Mesh>(null);
  const spreaderRef = useRef<Mesh>(null);
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
  });

  return (
    <group>
      <mesh
        material={quayMaterial}
        position={[(QUAY.x0 + QUAY.x1) / 2, (QUAY_TOP - 4) / 2, (QUAY.z0 + QUAY.z1) / 2]}
        receiveShadow
      >
        <boxGeometry args={[QUAY.x1 - QUAY.x0, QUAY_TOP + 4, QUAY.z1 - QUAY.z0]} />
      </mesh>

      <group position={CRANE_POSITION}>
        <mesh geometry={crane.structure} material={steel} castShadow receiveShadow />
        <mesh geometry={crane.house} material={house} castShadow receiveShadow />
        <mesh geometry={crane.lights} material={navLights} />
        <mesh ref={trolleyRef} geometry={trolley} material={dark} position-y={CRANE.trolleyY} castShadow />
      </group>
      <mesh ref={spreaderRef} geometry={spreader} material={spreaderPaint} castShadow />
      <lineSegments geometry={ropes} material={ropeMaterial} frustumCulled={false} />

      {/* The APG box the crane moves: from the ship's bay to the trailer. */}
      <group ref={boxRef} position={SHIP_PICK_POINT}>
        <mesh geometry={getContainerGeometry("40")} material={apgBoxMaterial} castShadow receiveShadow />
        <mesh geometry={getStripeGeometry("40")} material={stripeMaterial} />
      </group>

      <ContainerStacks areas={["port"]} />
    </group>
  );
}
