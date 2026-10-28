"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CylinderGeometry,
  type Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SCENE_POSITIONS } from "../camera-path";
import { sampleLight } from "../lightKeys";
import { beam, block } from "../models/craneGeometry";
import { TERMINAL_BLOCKS } from "../models/stackLayout";
import { journeyProgress } from "../progress";
import { createConcreteMaterial, yardUniforms } from "./concrete";
import { ContainerStacks } from "./ContainerStacks";
import { lostInFog, withSkyFog } from "./skyShared";

const [tx, , tz] = SCENE_POSITIONS.terminal;
const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// Yard slab, local to the terminal.
const YARD = { x0: tx - 62, x1: tx + 62, z0: tz - 70, z1: tz + 48 };

// Warehouse (cross-docking): 46 docks, 23 on each long face; the front faces the yard.
const DOCKS_PER_FACE = 23;
const DOCK_PITCH = 3.6;
const HALL = { x: tx, z: tz - 45, length: DOCKS_PER_FACE * DOCK_PITCH + 1.2, depth: 18, height: 10 };
const DOCK_FLOOR = 1.3;

// Lanes run between the stack blocks: x between columns, z between the two rows and in front of the hall.
const xs = [...new Set(TERMINAL_BLOCKS.map((b) => b.x))].sort((a, b) => a - b);
const zs = [...new Set(TERMINAL_BLOCKS.map((b) => b.z))].sort((a, b) => b - a);
const hx = TERMINAL_BLOCKS[0].hx;
const hz = TERMINAL_BLOCKS[0].hz;
// Blocks share one size, so a lane between two blocks sits midway between their centers.
const laneX = xs.slice(1).map((x, i) => (x + xs[i]) / 2);
const laneZ = [(zs[0] + zs[1]) / 2, (zs[1] - hz + HALL.z + HALL.depth / 2) / 2];

// High-mast lights at the lane crossings and the yard's ends.
const MASTS: [number, number][] = [
  ...laneX.flatMap((x) => laneZ.map((z) => [x, z] as [number, number])),
  [xs[0] - hx - 6, laneZ[0]],
  [xs[xs.length - 1] + hx + 6, laneZ[0]],
  ...laneX.map((x) => [x, zs[0] + hz + 6] as [number, number]),
];
const MAST_HEIGHT = 25;

const floorMaterial = createConcreteMaterial({
  outlines: TERMINAL_BLOCKS,
  dashes: [
    ...laneX.map((x) => ({ from: [x, YARD.z0 + 30] as [number, number], to: [x, YARD.z1 - 2] as [number, number] })),
    ...laneZ.map((z) => ({ from: [YARD.x0 + 2, z] as [number, number], to: [YARD.x1 - 2, z] as [number, number] })),
  ],
  lamps: MASTS,
});
const cladding = withSkyFog(new MeshStandardMaterial({ color: "#b9bcc2", roughness: 0.7, metalness: 0.2 }));
const roofing = withSkyFog(new MeshStandardMaterial({ color: "#7f838a", roughness: 0.8 }));
const doorPaint = withSkyFog(new MeshStandardMaterial({ color: "#4a5160", roughness: 0.6, metalness: 0.3 }));
const mastPaint = withSkyFog(new MeshStandardMaterial({ color: "#8a8e95", roughness: 0.6, metalness: 0.4 }));
// Lamp crowns: dark by day, sodium-warm emissive at night (Prompt 14's bloom picks them up).
const lampPaint = withSkyFog(
  new MeshStandardMaterial({ color: "#2b2b2b", emissive: "#ffb46b", emissiveIntensity: 0, roughness: 0.4 }),
);
const stackerYellow = withSkyFog(new MeshStandardMaterial({ color: "#cf9f36", roughness: 0.55, metalness: 0.2 }));
const stackerDark = withSkyFog(new MeshStandardMaterial({ color: "#26292f", roughness: 0.7, metalness: 0.2 }));

const hall = mergeGeometries([
  block(v(-HALL.length / 2, 0, -HALL.depth / 2), v(HALL.length / 2, HALL.height, HALL.depth / 2)),
  // Dock platforms along both faces.
  ...[-1, 1].map((s) =>
    block(v(-HALL.length / 2, 0, s * HALL.depth / 2 - (s < 0 ? 2 : 0)), v(HALL.length / 2, DOCK_FLOOR, s * HALL.depth / 2 + (s > 0 ? 2 : 0))),
  ),
])!;
const hallRoof = mergeGeometries([
  block(v(-HALL.length / 2 - 0.3, HALL.height, -HALL.depth / 2 - 0.3), v(HALL.length / 2 + 0.3, HALL.height + 0.6, HALL.depth / 2 + 0.3)),
  // Canopies over the docks.
  ...[-1, 1].map((s) =>
    block(v(-HALL.length / 2, 6.6, s > 0 ? HALL.depth / 2 : -HALL.depth / 2 - 4), v(HALL.length / 2, 6.9, s > 0 ? HALL.depth / 2 + 4 : -HALL.depth / 2)),
  ),
])!;

// Reach stacker, simplified: chassis, cab, counterweight, telescopic boom, spreader, wheels.
function reachStackerGeometry() {
  const wheels = [-1, 1].flatMap((sx) =>
    [-2.3, 2.3].map((z) =>
      new CylinderGeometry(0.75, 0.75, 0.6, 12).rotateZ(Math.PI / 2).translate(sx * 1.7, 0.75, z),
    ),
  );
  return {
    yellow: mergeGeometries([
      block(v(-1.7, 0.7, -3.5), v(1.7, 1.9, 3.5)),
      block(v(-1.5, 1.9, -4.0), v(1.5, 3.4, -2.6)),
      beam(v(0, 2.6, -2.2), v(0, 8.2, 4.6), 0.7),
    ])!,
    dark: mergeGeometries([
      ...wheels,
      block(v(-1.5, 1.9, 0), v(0.3, 4.1, 1.8)),
      block(v(-3.05, 7.3, 4.6), v(3.05, 7.7, 5.6)),
    ])!,
  };
}
const stacker = reachStackerGeometry();
const STACKERS: { at: [number, number]; heading: number }[] = [
  { at: [laneX[0], zs[0] - 4], heading: 0 },
  { at: [laneX[1], zs[1] + 2], heading: Math.PI },
  { at: [xs[1], laneZ[1]], heading: Math.PI / 2 },
];

function instancedAt(geometry: InstancedMesh["geometry"], material: MeshStandardMaterial, spots: Object3D[]) {
  const mesh = new InstancedMesh(geometry, material, spots.length);
  spots.forEach((o, i) => {
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const light = sampleLight(0);
// Everything the terminal draws fits in this sphere.
const BOUNDS = { center: v((YARD.x0 + YARD.x1) / 2, 10, (YARD.z0 + YARD.z1) / 2), radius: 90 };

export function Terminal() {
  const group = useRef<Group>(null);
  const meshes = useMemo(() => {
    const doorSpots = [-1, 1].flatMap((s) =>
      Array.from({ length: DOCKS_PER_FACE }, (_, i) => {
        const o = new Object3D();
        o.position.set(HALL.x - HALL.length / 2 + 0.6 + DOCK_PITCH * (i + 0.5), DOCK_FLOOR + 1.5, HALL.z + s * (HALL.depth / 2 + 0.06));
        return o;
      }),
    );
    const mastSpots = MASTS.map(([x, z]) => {
      const o = new Object3D();
      o.position.set(x, 0, z);
      return o;
    });
    return [
      instancedAt(new CylinderGeometry(0.22, 0.38, MAST_HEIGHT, 8).translate(0, MAST_HEIGHT / 2, 0), mastPaint, mastSpots),
      instancedAt(block(v(-1.8, MAST_HEIGHT, -0.7), v(1.8, MAST_HEIGHT + 0.6, 0.7)), lampPaint, mastSpots),
      instancedAt(block(v(-1.5, -1.5, -0.06), v(1.5, 1.5, 0.06)), doorPaint, doorSpots),
    ];
  }, []);

  useFrame(({ camera }) => {
    group.current!.visible = !lostInFog(camera.position, BOUNDS.center, BOUNDS.radius);
    const { lamps } = sampleLight(journeyProgress.value, light);
    yardUniforms.uLamps.value = lamps;
    lampPaint.emissiveIntensity = lamps * 4;
  });

  return (
    <group ref={group}>
      <mesh
        material={floorMaterial}
        rotation-x={-Math.PI / 2}
        position={[(YARD.x0 + YARD.x1) / 2, 0.01, (YARD.z0 + YARD.z1) / 2]}
        receiveShadow
      >
        <planeGeometry args={[YARD.x1 - YARD.x0, YARD.z1 - YARD.z0]} />
      </mesh>

      <group position={[HALL.x, 0, HALL.z]}>
        <mesh geometry={hall} material={cladding} castShadow receiveShadow />
        <mesh geometry={hallRoof} material={roofing} castShadow receiveShadow />
      </group>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}

      {STACKERS.map(({ at: [x, z], heading }, i) => (
        <group key={i} position={[x, 0, z]} rotation-y={heading}>
          <mesh geometry={stacker.yellow} material={stackerYellow} castShadow receiveShadow />
          <mesh geometry={stacker.dark} material={stackerDark} castShadow receiveShadow />
        </group>
      ))}

      <ContainerStacks areas={["terminal"]} />
    </group>
  );
}
