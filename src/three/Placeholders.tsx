"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { type Mesh, MeshStandardMaterial } from "three";
import { QUAY_TOP, SHIP_DECK_Y, SHIP_PICK_POINT, TRUCK_LOAD_POINT } from "./anchors";
import { SCENE_POSITIONS } from "./camera-path";
import { CONTAINER } from "./models/containerGeometry";
import { journeyProgress } from "./progress";
import { OCEAN_FADE } from "./scene/Ocean";
import { withSkyFog } from "./scene/skyShared";

// shortcut: colored boxes mark the scenes still to model (hero ship: Prompt 11; highway and distribution:
// Prompt 12). Crane, load and terminal are real models now.
const BOX_SCENES = [
  { id: "hero", color: "#f2913d" },
  { id: "highway", color: "#8b94a8" },
  { id: "distribution", color: "#e31e24" },
] as const;

const groundMaterial = withSkyFog(new MeshStandardMaterial({ color: "#0a1338" }));
const standIn = withSkyFog(new MeshStandardMaterial({ color: "#1d2233", roughness: 0.8 }));
const boxMaterials = BOX_SCENES.map(({ color }) => withSkyFog(new MeshStandardMaterial({ color })));

const BOXES: [number, number, number, number, number, number][] = [
  // x, y, z offset, then width, height, depth
  [0, 1, 0, 3, 2, 3],
  [-3, 0.6, 1.5, 1.6, 1.2, 1.6],
  [2.6, 0.4, -2, 1.2, 0.8, 2.4],
];

// shortcut: a hull under the deck bay and a trailer bed under the load point, so boxes don't float until
// the GLB ship and truck land (Prompt 11).
const HULL = { width: 10, length: 50, bottom: -3 };
const BED = { width: 2.5, depth: 0.3, length: CONTAINER["40"].length + 0.4 };

export function Placeholders() {
  const ground = useRef<Mesh>(null);
  // Land takes over as the sea fades; just below the (flattened) sea so they never z-fight.
  useFrame(() => (ground.current!.visible = journeyProgress.value >= OCEAN_FADE[0]));

  return (
    <>
      <mesh ref={ground} rotation-x={-Math.PI / 2} position={[0, -0.02, -40]} material={groundMaterial} receiveShadow>
        {/* Past the camera's far plane (400) in every direction, so the fog, not an edge, meets the sky. */}
        <planeGeometry args={[1200, 1200]} />
      </mesh>
      {BOX_SCENES.map(({ id }, k) => (
        <group key={id} position={SCENE_POSITIONS[id]}>
          {BOXES.map(([x, y, z, w, h, d], i) => (
            <mesh key={i} position={[x, y, z]} material={boxMaterials[k]} castShadow receiveShadow>
              <boxGeometry args={[w, h, d]} />
            </mesh>
          ))}
        </group>
      ))}

      <mesh
        material={standIn}
        position={[SHIP_PICK_POINT.x, (SHIP_DECK_Y + HULL.bottom) / 2, SHIP_PICK_POINT.z]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[HULL.width, SHIP_DECK_Y - HULL.bottom, HULL.length]} />
      </mesh>
      <mesh
        material={standIn}
        position={[TRUCK_LOAD_POINT.x, TRUCK_LOAD_POINT.y - BED.depth / 2, TRUCK_LOAD_POINT.z]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[BED.width, BED.depth, BED.length]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          material={standIn}
          position={[TRUCK_LOAD_POINT.x, (QUAY_TOP + TRUCK_LOAD_POINT.y - BED.depth) / 2, TRUCK_LOAD_POINT.z + s * 4.5]}
          castShadow
        >
          <boxGeometry args={[BED.width, TRUCK_LOAD_POINT.y - BED.depth - QUAY_TOP, 2.2]} />
        </mesh>
      ))}
    </>
  );
}
