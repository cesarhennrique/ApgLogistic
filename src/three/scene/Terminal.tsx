"use client";

import { useMemo } from "react";
import { BoxGeometry, CylinderGeometry, Matrix4, Object3D, Vector3 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BlueprintMesh } from "../blueprint/BlueprintMesh";
import { beam, block } from "../models/craneGeometry";
import { DOCK_FLOOR, DOCK_PITCH, DOCKS_PER_FACE, HALL, laneX, MAST_HEIGHT, MASTS, xs, YARD, zs, laneZ } from "../models/terminalLayout";
import { ContainerStacks } from "./ContainerStacks";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

// The yard: a thin slab, its edges the site's outline. (Its markings come with the plan view, Prompt 13c.)
const yard = new BoxGeometry(YARD.x1 - YARD.x0, 0.1, YARD.z1 - YARD.z0).translate((YARD.x0 + YARD.x1) / 2, -0.05, (YARD.z0 + YARD.z1) / 2);

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
      new CylinderGeometry(0.75, 0.75, 0.6, 24).rotateZ(Math.PI / 2).translate(sx * 1.7, 0.75, z),
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

const matricesAt = (spots: Object3D[]) =>
  spots.map((o) => {
    o.updateMatrix();
    return new Matrix4().copy(o.matrix);
  });
const mast = new CylinderGeometry(0.22, 0.38, MAST_HEIGHT, 24).translate(0, MAST_HEIGHT / 2, 0);
const crown = block(v(-1.8, MAST_HEIGHT, -0.7), v(1.8, MAST_HEIGHT + 0.6, 0.7));
const door = block(v(-1.5, -1.5, -0.06), v(1.5, 1.5, 0.06));

// The CONE terminal, as a drawing: yard, warehouse with its docks, light masts, reach stackers and the stacks.
export function Terminal() {
  const { doors, masts } = useMemo(() => {
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
    return { doors: matricesAt(doorSpots), masts: matricesAt(mastSpots) };
  }, []);

  return (
    <group>
      <BlueprintMesh geometry={yard} />
      <group position={[HALL.x, 0, HALL.z]}>
        <BlueprintMesh geometry={hall} />
        <BlueprintMesh geometry={hallRoof} />
      </group>
      <BlueprintMesh geometry={mast} matrices={masts} />
      <BlueprintMesh geometry={crown} matrices={masts} />
      <BlueprintMesh geometry={door} matrices={doors} weight="secondary" />

      {STACKERS.map(({ at: [x, z], heading }, i) => (
        <group key={i} position={[x, 0, z]} rotation-y={heading}>
          <BlueprintMesh geometry={stacker.yellow} />
          <BlueprintMesh geometry={stacker.dark} />
        </group>
      ))}

      <ContainerStacks areas={["terminal"]} />
    </group>
  );
}
