"use client";

import { useMemo } from "react";
import { Color, InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { type ContainerType, getContainerGeometry, getStripeGeometry } from "../models/containerGeometry";
import { STACKS, type StackedContainer } from "../models/stackLayout";
import { withSkyFog } from "./skyShared";

// White base: each instance's color comes from the layout (carrier palette or APG navy).
export const containerMaterial = withSkyFog(new MeshStandardMaterial({ roughness: 0.72, metalness: 0.15 }));
export const stripeMaterial = withSkyFog(new MeshStandardMaterial({ color: "#e31e24", roughness: 0.6 }));

const TYPES: ContainerType[] = ["20", "40"];

function instanced(list: StackedContainer[], type: ContainerType, stripe: boolean) {
  const items = list.filter((c) => c.type === type && (!stripe || c.apg));
  if (items.length === 0) return null;
  const mesh = new InstancedMesh(
    stripe ? getStripeGeometry(type) : getContainerGeometry(type),
    stripe ? stripeMaterial : containerMaterial,
    items.length,
  );
  const dummy = new Object3D();
  const color = new Color();
  items.forEach((c, i) => {
    dummy.position.set(...c.position);
    dummy.rotation.y = c.rotated ? Math.PI / 2 : 0;
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (!stripe) mesh.setColorAt(i, color.set(c.color));
  });
  // Bounds of all instances, so a whole area is culled at once when it's off screen.
  mesh.computeBoundingSphere();
  mesh.castShadow = !stripe;
  mesh.receiveShadow = true;
  return mesh;
}

// Every stack in the given areas: per block, one draw per container type and one per type for the APG
// stripes. Per block, not per area: a whole yard's bounds would drag it into far-off frusta and shadow passes.
export function ContainerStacks({ areas }: { areas: StackedContainer["area"][] }) {
  const key = areas.join(",");
  const meshes = useMemo(() => {
    const list = STACKS.filter((c) => key.split(",").includes(c.area));
    const blocks = [...new Set(list.map((c) => c.block))];
    return blocks
      .flatMap((b) => {
        const inBlock = list.filter((c) => c.block === b);
        return TYPES.flatMap((t) => [instanced(inBlock, t, false), instanced(inBlock, t, true)]);
      })
      .filter((m) => m !== null);
  }, [key]);

  return (
    <>
      {meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </>
  );
}
