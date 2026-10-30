"use client";

import { type ThreeElements, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  type BufferGeometry,
  InstancedInterleavedBuffer,
  InstancedMesh,
  InterleavedBufferAttribute,
  type Matrix4,
  Mesh,
  type MeshBasicMaterial,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { cumulativeLengths, edgeSegments, instanceSegments } from "./edges";
import { fillMaterial, lineMaterial, type Tone } from "./ink";

// A reveal, fixed or read every frame (a function: no re-render per frame).
export type Reveal = number | (() => number);
export const readReveal = (reveal: Reveal | undefined) => (typeof reveal === "function" ? reveal() : (reveal ?? 1));

// The edges draw over the first 60% of the reveal, the fill fades in over the rest.
const EDGES_END = 0.6;

const edgeCache = new WeakMap<BufferGeometry, Float32Array>();
function cachedEdges(geometry: BufferGeometry) {
  let edges = edgeCache.get(geometry);
  if (!edges) edgeCache.set(geometry, (edges = edgeSegments(geometry)));
  return edges;
}

export function buildEdges(segments: Float32Array, weight: "primary" | "secondary") {
  const geometry = new LineSegmentsGeometry().setPositions(segments);
  const distances = cumulativeLengths(segments);
  const buffer = new InstancedInterleavedBuffer(distances, 2, 1);
  geometry.setAttribute("instanceDistanceStart", new InterleavedBufferAttribute(buffer, 1, 0));
  geometry.setAttribute("instanceDistanceEnd", new InterleavedBufferAttribute(buffer, 1, 1));
  const total = distances[distances.length - 1] ?? 0;
  const material = lineMaterial(weight);
  material.dashSize = total;
  material.gapSize = total;
  const lines = new LineSegments2(geometry, material);
  lines.userData.total = total;
  return lines;
}

type Props = Omit<ThreeElements["group"], "children"> & {
  geometry: BufferGeometry;
  // One copy per matrix (an InstancedMesh fill, the edges merged).
  matrices?: Matrix4[];
  weight?: "primary" | "secondary";
  // A fixed tone (the APG box): no theme fill, and no light edges.
  tone?: Tone;
  edges?: boolean;
  reveal?: Reveal;
};

// The technical drawing of a geometry (spec §6, "Render de planta técnica"): an unlit two-tone fill and its
// creases in constant-width line work, both built in by `reveal` (0–1).
export function BlueprintMesh({ geometry, matrices, weight = "primary", tone, edges = !tone, reveal, ...group }: Props) {
  const { fill, line } = useMemo(() => {
    const material = fillMaterial(tone);
    let fill: Mesh;
    if (matrices) {
      const mesh = new InstancedMesh(geometry, material, matrices.length);
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.computeBoundingSphere();
      fill = mesh;
    } else fill = new Mesh(geometry, material);
    const segments = edges ? (matrices ? instanceSegments(cachedEdges(geometry), matrices) : cachedEdges(geometry)) : null;
    return { fill, line: segments && segments.length ? buildEdges(segments, weight) : null };
  }, [geometry, matrices, tone, edges, weight]);
  const fillRef = useRef<Mesh>(null);
  const lineRef = useRef<LineSegments2>(null);

  useFrame(() => {
    const f = readReveal(reveal);
    const drawn = Math.min(f / EDGES_END, 1);
    const fade = Math.max((f - EDGES_END) / (1 - EDGES_END), 0);
    const mesh = fillRef.current!;
    mesh.visible = fade > 0;
    (mesh.material as MeshBasicMaterial).opacity = fade;
    const lines = lineRef.current;
    if (lines) {
      lines.visible = drawn > 0;
      lines.material.dashOffset = lines.userData.total * (1 - drawn);
    }
  });

  return (
    <group {...group}>
      <primitive ref={fillRef} object={fill} />
      {line && <primitive ref={lineRef} object={line} />}
    </group>
  );
}
