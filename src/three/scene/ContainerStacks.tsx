"use client";

import { useMemo } from "react";
import { Matrix4, Object3D } from "three";
import { BlueprintMesh, type Reveal } from "../blueprint/BlueprintMesh";
import { APG_TONE, RED_TONE } from "../blueprint/ink";
import { type ContainerType, getContainerBox, getStripeBand } from "../models/containerGeometry";
import { STACKS, type StackedContainer } from "../models/stackLayout";

const TYPES: ContainerType[] = ["20", "40"];

function matricesOf(list: StackedContainer[]) {
  const o = new Object3D();
  return list.map((c) => {
    o.position.set(...c.position);
    o.rotation.y = c.rotated ? Math.PI / 2 : 0;
    o.updateMatrix();
    return new Matrix4().copy(o.matrix);
  });
}

// The APG box on its own: navy with the red band, solid, the one object not drawn in line.
export function ApgBox({ reveal }: { reveal?: Reveal }) {
  return (
    <>
      <BlueprintMesh geometry={getContainerBox("40")} tone={APG_TONE} reveal={reveal} />
      <BlueprintMesh geometry={getStripeBand("40")} tone={RED_TONE} reveal={reveal} />
    </>
  );
}

// Every stack in the given areas, per container type: the carriers' boxes in line work and theme fill, the APG ones
// solid (navy and red).
export function ContainerStacks({ areas, reveal }: { areas: StackedContainer["area"][]; reveal?: Reveal }) {
  const key = areas.join(",");
  const sets = useMemo(() => {
    const list = STACKS.filter((c) => key.split(",").includes(c.area));
    return TYPES.map((type) => ({
      type,
      plain: matricesOf(list.filter((c) => c.type === type && !c.apg)),
      apg: matricesOf(list.filter((c) => c.type === type && c.apg)),
    }));
  }, [key]);

  return (
    <>
      {sets.map(({ type, plain, apg }) => (
        <group key={type}>
          {plain.length > 0 && <BlueprintMesh geometry={getContainerBox(type)} matrices={plain} reveal={reveal} />}
          {apg.length > 0 && (
            <>
              <BlueprintMesh geometry={getContainerBox(type)} matrices={apg} tone={APG_TONE} reveal={reveal} />
              <BlueprintMesh geometry={getStripeBand(type)} matrices={apg} tone={RED_TONE} reveal={reveal} />
            </>
          )}
        </group>
      ))}
    </>
  );
}
