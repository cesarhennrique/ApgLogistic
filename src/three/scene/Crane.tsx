"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  type Group,
  Vector3,
  LineBasicMaterial,
  type Mesh,
  MeshStandardMaterial,
} from "three";
import { CRANE_POSITION, QUAY_EDGE_X, QUAY_TOP, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "../anchors";
import { craneState } from "../craneMotion";
import { CONTAINER, getContainerGeometry, getStripeGeometry } from "../models/containerGeometry";
import { buildCraneGeometry, buildSpreaderGeometry, buildTrolleyGeometry, CRANE } from "../models/craneGeometry";
import { APG_NAVY } from "../models/stackLayout";
import { journeyProgress } from "../progress";
import { createConcreteMaterial } from "./concrete";
import { ContainerStacks, stripeMaterial } from "./ContainerStacks";
import { lostInFog, withSkyFog } from "./skyShared";

const crane = buildCraneGeometry();
const trolley = buildTrolleyGeometry();
const spreader = buildSpreaderGeometry(CONTAINER["40"].length);

// Light grey steel with a warm rim: silhouette edges catch the low sun, strongest on the sun's side.
const steelBase = new MeshStandardMaterial({ color: "#c9ccd1", roughness: 0.55, metalness: 0.35 });
steelBase.customProgramCacheKey = () => "crane-rim";
steelBase.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <emissivemap_fragment>",
    /* glsl */ `#include <emissivemap_fragment>
    float rim = pow(1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0), 3.0);
    vec3 sunView = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
    totalEmissiveRadiance += uSunColor * uSunIntensity * rim * (0.12 + 0.3 * max(dot(normal, sunView), 0.0));`,
  );
};
const steel = withSkyFog(steelBase);
// Sand details (machinery house, boom head) and the A-frame's red obstruction lights.
const house = withSkyFog(new MeshStandardMaterial({ color: "#d8c8a6", roughness: 0.65, metalness: 0.1 }));
const navLights = withSkyFog(
  new MeshStandardMaterial({ color: "#3a0d0a", emissive: "#ff2a1a", emissiveIntensity: 4, roughness: 0.4 }),
);
const dark = withSkyFog(new MeshStandardMaterial({ color: "#30353f", roughness: 0.5, metalness: 0.3 }));
const spreaderPaint = withSkyFog(new MeshStandardMaterial({ color: "#c99a3a", roughness: 0.5, metalness: 0.3 }));
const navy = withSkyFog(new MeshStandardMaterial({ color: APG_NAVY, roughness: 0.72, metalness: 0.15 }));
const ropeMaterial = withSkyFog(new LineBasicMaterial({ color: "#1c1f26" }));

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
// Everything the port draws (quay, crane up to its apex, ship bay, stacks) fits in this sphere.
const BOUNDS = {
  center: new Vector3((QUAY.x0 + QUAY.x1) / 2 - 10, 15, (QUAY.z0 + QUAY.z1) / 2),
  radius: 95,
};

export function Crane({ reducedMotion }: { reducedMotion: boolean }) {
  const port = useRef<Group>(null);
  const trolleyRef = useRef<Mesh>(null);
  const spreaderRef = useRef<Mesh>(null);
  const boxRef = useRef<Group>(null);
  // null until the first frame, so loading straight into a locked state (?p=0.15) doesn't clack.
  const wasLocked = useRef<boolean | null>(null);
  const clackAt = useRef(-Infinity);

  useFrame(({ camera, clock }) => {
    port.current!.visible = !lostInFog(camera.position, BOUNDS.center, BOUNDS.radius);
    craneState(journeyProgress.value, state);
    const { trolleyX, spreaderY, container, locked } = state;

    trolleyRef.current!.position.x = trolleyX - CRANE_POSITION.x;
    spreaderRef.current!.position.set(trolleyX, spreaderY, CRANE_POSITION.z);
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
    <group ref={port}>
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
        <mesh geometry={getContainerGeometry("40")} material={navy} castShadow receiveShadow />
        <mesh geometry={getStripeGeometry("40")} material={stripeMaterial} />
      </group>

      <ContainerStacks areas={["port", "ship"]} />
    </group>
  );
}
