"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  FileLoader,
  Float32BufferAttribute,
  type Group,
  InstancedMesh,
  Matrix4,
  Object3D,
  ShapeGeometry,
  Vector3,
} from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { site } from "@/content/site";
import { localProgress } from "../chapters";
import { block } from "../models/craneGeometry";
import {
  GALPAO_DOOR,
  MAP_ORIGIN,
  MAP_SCALE,
  MAP_TOP,
  toSvg,
  VAN_DESTINATIONS,
  vanStateAt,
} from "../models/distributionLayout";
import { journeyProgress } from "../progress";
import { BlueprintMesh } from "../blueprint/BlueprintMesh";
import { fillMaterial } from "../blueprint/ink";
import { inView } from "../stages/inView";

const highlight = new Set(site.home.coverage.highlight);
const [suapeX, suapeY] = toSvg(GALPAO_DOOR);

// SVG units → meters on the ground (distributionLayout's toMap): x east, SVG y (south) → +Z, extrusion up.
// That is a reflection, so the triangles' winding is flipped back afterwards (faces stay up).
const svgToWorld = new Matrix4().set(
  MAP_SCALE, 0, 0, MAP_ORIGIN.x - suapeX * MAP_SCALE,
  0, 0, 1, 0,
  0, MAP_SCALE, 0, MAP_ORIGIN.z - suapeY * MAP_SCALE,
  0, 0, 0, 1,
);

function toGround(geometry: BufferGeometry) {
  const g = geometry.toNonIndexed().applyMatrix4(svgToWorld);
  for (const name of ["position", "normal", "uv"] as const) {
    const a = g.getAttribute(name);
    if (!a) continue;
    // Swap each triangle's 2nd and 3rd vertices.
    for (let i = 0; i < a.count; i += 3) {
      for (let k = 0; k < a.itemSize; k++) {
        const t = a.getComponent(i + 1, k);
        a.setComponent(i + 1, k, a.getComponent(i + 2, k));
        a.setComponent(i + 2, k, t);
      }
    }
  }
  return g;
}


function Map() {
  // The same raw text the hero map loads: useLoader caches by URL, so both must ask with the same loader.
  const svg = useLoader(FileLoader, "/images/map/nordeste.svg") as string;
  const [states, context] = useMemo(() => {
    const { paths } = new SVGLoader().parse(svg);
    // Flat shapes: their only creases are the borders (an extruded coastline would draw a tick per vertex).
    const lit: BufferGeometry[] = [];
    const flat: BufferGeometry[] = [];
    for (const path of paths) {
      const id = (path.userData?.node as Element | undefined)?.id ?? "";
      const shape = toGround(new ShapeGeometry(path.toShapes()));
      if (highlight.has(id)) lit.push(shape.translate(0, MAP_TOP, 0));
      else flat.push(shape.translate(0, 0.05, 0));
    }
    return [mergeGeometries(lit)!, mergeGeometries(flat)!];
  }, [svg]);
  // PE and BA in the main stroke, the other states in the secondary one.
  return (
    <>
      <BlueprintMesh geometry={states} />
      <BlueprintMesh geometry={context} weight="secondary" />
    </>
  );
}

// A small delivery truck (VUC), scaled to the map: white box body, cab, dark windshield and the APG red line.
function vanGeometry() {
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
  const part = (g: BufferGeometry, hex: string) => {
    const c = new Color(hex);
    const n = g.attributes.position.count;
    g.setAttribute("color", new Float32BufferAttribute(Array.from({ length: n * 3 }, (_, i) => [c.r, c.g, c.b][i % 3]), 3));
    return g;
  };
  return mergeGeometries([
    part(block(v(-1.1, 0.4, -2.4), v(1.1, 2.8, 1.1)), "#edebe6"),
    part(block(v(-1.05, 0.4, 1.1), v(1.05, 2.2, 2.6)), "#edebe6"),
    part(block(v(-0.95, 1.4, 2.6), v(0.95, 2.05, 2.63)), "#14171f"),
    part(block(v(-1.12, 1.6, -2.3), v(1.12, 1.85, 1.0)), "#e31e24"),
    part(new BoxGeometry(2.0, 0.4, 4.6).translate(0, 0.2, 0.1), "#1a1b1e"),
  ])!.scale(0.45, 0.45, 0.45);
}

// Small and moving: fill only, in the theme's tone.
const vans = new InstancedMesh(vanGeometry(), fillMaterial(), VAN_DESTINATIONS.length);
vans.frustumCulled = false;
const dummy = new Object3D();
const state = vanStateAt(0, 0);

// The distribution warehouse at Suape: its door opens onto the map.
const GALPAO = { width: 28, depth: 22, height: 11 };
const doorway = new BoxGeometry(0.05, 7, 9).translate(-0.02, 3.6, 0);
const galpao = mergeGeometries([
  block(new Vector3(0, 0, -GALPAO.depth / 2), new Vector3(GALPAO.width, GALPAO.height, GALPAO.depth / 2)),
  block(new Vector3(-0.4, GALPAO.height, -GALPAO.depth / 2 - 0.4), new Vector3(GALPAO.width + 0.4, GALPAO.height + 0.6, GALPAO.depth / 2 + 0.4)),
])!;

// Chapter 5: out of the warehouse, the vans fan out across Pernambuco and Bahia.
export function Distribution() {
  const group = useRef<Group>(null);
  // The map (an SVG fetch, then triangulating PE and BA) is built only once the journey nears it, not on load.
  const [near, setNear] = useState(false);

  useFrame(() => {
    const p = journeyProgress.value;
    if (!near && p > 0.6) setNear(true);
    // Only while its stage is on screen.
    if (!inView(group.current!)) return;
    const u = localProgress(p, "distribution");
    for (let i = 0; i < VAN_DESTINATIONS.length; i++) {
      vanStateAt(i, u, state);
      dummy.position.set(state.x, MAP_TOP, state.z);
      dummy.rotation.set(0, state.heading, 0);
      dummy.scale.setScalar(state.visible ? 1 : 0);
      dummy.updateMatrix();
      vans.setMatrixAt(i, dummy.matrix);
    }
    vans.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      {near && (
        <Suspense fallback={null}>
          <Map />
        </Suspense>
      )}
      <group position={[GALPAO_DOOR.x + 1, 0, GALPAO_DOOR.z]}>
        <BlueprintMesh geometry={galpao} />
        {/* The open door, facing the map (west). */}
        <BlueprintMesh geometry={doorway} weight="secondary" />
      </group>
      <primitive object={vans} />
    </group>
  );
}
