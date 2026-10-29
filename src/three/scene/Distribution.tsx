"use client";

import { useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import {
  BoxGeometry,
  type BufferGeometry,
  Color,
  ExtrudeGeometry,
  FileLoader,
  Float32BufferAttribute,
  type Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
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
import { inView } from "../stages/inView";

const highlight = new Set(site.home.coverage.highlight);
const [suapeX, suapeY] = toSvg(GALPAO_DOOR);

// SVG units → meters on the ground (distributionLayout's toMap): x east, SVG y (south) → +Z, extrusion up.
// That is a reflection, so the triangles' winding is flipped back afterwards (faces stay outward).
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

// PE and BA: sand slabs, two tones so the border reads, glowing faintly so the map reads at night like a lit
// diorama. The other states: dark and flat.
const stateMaterial = (hex: string) =>
  new MeshStandardMaterial({ color: hex, emissive: hex, emissiveIntensity: 0.45, roughness: 0.7 });
const STATE_MATERIALS: Record<string, MeshStandardMaterial> = { PE: stateMaterial("#f3efe7"), BA: stateMaterial("#cfc6b4") };
const contextMaterial = new MeshStandardMaterial({ color: "#1c2550", roughness: 0.9 });
const cladding = new MeshStandardMaterial({ color: "#b9bcc2", roughness: 0.7, metalness: 0.2 });
const doorway = new MeshStandardMaterial({ color: "#1a1a1f", emissive: "#ffd9a0", emissiveIntensity: 0.6, roughness: 0.9 });
const vanPaint = new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 });

function Map() {
  // The same raw text the hero map loads: useLoader caches by URL, so both must ask with the same loader.
  const svg = useLoader(FileLoader, "/images/map/nordeste.svg") as string;
  const [states, context] = useMemo(() => {
    const { paths } = new SVGLoader().parse(svg);
    const lit: { id: string; geometry: BufferGeometry }[] = [];
    const flat: BufferGeometry[] = [];
    for (const path of paths) {
      const id = (path.userData?.node as Element | undefined)?.id ?? "";
      const shapes = SVGLoader.createShapes(path);
      if (highlight.has(id)) {
        lit.push({ id, geometry: toGround(new ExtrudeGeometry(shapes, { depth: MAP_TOP, bevelEnabled: false })) });
      } else flat.push(toGround(new ShapeGeometry(shapes)).translate(0, 0.05, 0));
    }
    return [lit, mergeGeometries(flat)!];
  }, [svg]);
  return (
    <>
      {states.map(({ id, geometry }) => (
        <mesh key={id} geometry={geometry} material={STATE_MATERIALS[id]} castShadow receiveShadow />
      ))}
      <mesh geometry={context} material={contextMaterial} receiveShadow />
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

const vans = new InstancedMesh(vanGeometry(), vanPaint, VAN_DESTINATIONS.length);
vans.castShadow = true;
vans.frustumCulled = false;
const dummy = new Object3D();
const state = vanStateAt(0, 0);

// The distribution warehouse at Suape: its door opens onto the map.
const GALPAO = { width: 28, depth: 22, height: 11 };
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
        <mesh geometry={galpao} material={cladding} castShadow receiveShadow />
        {/* The open door, lit from inside, facing the map (west). */}
        <mesh material={doorway} position={[-0.02, 3.6, 0]}>
          <boxGeometry args={[0.05, 7, 9]} />
        </mesh>
      </group>
      <primitive object={vans} />
    </group>
  );
}
