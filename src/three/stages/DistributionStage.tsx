"use client";

import { Line } from "@react-three/drei";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { type ComponentRef, Suspense, useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  FileLoader,
  LineBasicMaterial,
  MathUtils,
  type Mesh,
  MeshBasicMaterial,
  type PerspectiveCamera,
  PointsMaterial,
  QuadraticBezierCurve3,
  RingGeometry,
  Vector3,
} from "three";
import { DELIVERIES, routeWindow } from "../models/distributionLayout";
import { buildDots, parseStates, toHero } from "../models/heroMapLayout";
import { distributionProgress } from "../progress";
import { MAP_IN, PE_BA_BOUNDS, PULL_BACK, sampleDistributionCamera, smoother } from "./distributionCamera";

const SAND = "#f3efe7";
const RED = "#e31e24";
// The 24 deliveries branch out (routeWindow), each destination lighting as its line lands, over this much of c.
const LAND = 0.05;

// The hero map's style (HeroMapStage): sand outlines at 35% and the dot grid, sized in map units.
const outlineMaterial = new LineBasicMaterial({ color: SAND, transparent: true, opacity: 0, depthWrite: false });
const DOT = 0.24;
const dotMaterial = new PointsMaterial({ size: DOT, vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
dotMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <color_fragment>",
    "#include <color_fragment>\nfloat r = length(gl_PointCoord - 0.5);\nif (r > 0.5) discard;\ndiffuseColor.a *= 1.0 - smoothstep(0.38, 0.5, r);",
  );
};

function Northeast() {
  const svg = useLoader(FileLoader, "/images/map/nordeste.svg") as string;
  const { outlines, dots } = useMemo(() => {
    const states = parseStates(svg);
    const flat: number[] = [];
    for (const rings of Object.values(states))
      for (const ring of rings)
        for (let i = 0; i < ring.length; i++) {
          const a = toHero(...ring[i]);
          const b = toHero(...ring[(i + 1) % ring.length]);
          flat.push(a.x, 0, a.z, b.x, 0, b.z);
        }
    const grid = buildDots(states);
    return {
      outlines: new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(flat), 3)),
      dots: new BufferGeometry()
        .setAttribute("position", new BufferAttribute(grid.positions, 3))
        .setAttribute("color", new BufferAttribute(grid.colors, 3)),
    };
  }, [svg]);
  // the map's first frame
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => invalidate(), [invalidate]);
  return (
    <>
      <lineSegments geometry={outlines} material={outlineMaterial} />
      <points geometry={dots} material={dotMaterial} />
    </>
  );
}

// Each delivery's line: a shallow arc from its hub, bowing to alternate sides (a fan out of each hub).
const ROUTES = DELIVERIES.map((d, i) => {
  const from = new Vector3(d.from.x, 0.03, d.from.z);
  const to = new Vector3(d.to.x, 0.03, d.to.z);
  const side = (i % 2 ? 1 : -1) * 0.16;
  const mid = from.clone().lerp(to, 0.5).add(new Vector3(-(to.z - from.z) * side, 0, (to.x - from.x) * side));
  const curve = new QuadraticBezierCurve3(from, mid, to);
  return { points: curve.getPoints(48), length: curve.getLength(), to };
});
const destinationGeometry = new CircleGeometry(0.32, 24).rotateX(-Math.PI / 2);
const ringGeometry = new RingGeometry(0.42, 0.56, 32).rotateX(-Math.PI / 2);
const destinationMaterials = ROUTES.map(() => new MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, depthWrite: false }));
const ringMaterials = ROUTES.map(() => new MeshBasicMaterial({ color: RED, transparent: true, opacity: 0, depthWrite: false }));

// Scene 5: the hero's map from straight above, the CONE terminal at its origin; the lines out to the deliveries.
// Everything follows distributionProgress (no clock): the canvas renders on demand.
export function DistributionStage() {
  const lines = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const dots = useRef<(Mesh | null)[]>([]);
  const rings = useRef<(Mesh | null)[]>([]);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    distributionProgress.invalidate = invalidate;
    invalidate();
    return () => {
      distributionProgress.invalidate = () => {};
    };
  }, [invalidate]);

  const target = useMemo(() => new Vector3(), []);
  useFrame(({ camera, size }) => {
    const c = distributionProgress.value;
    const cam = camera as PerspectiveCamera;
    // The camera straight down, north up, so that the origin sits at cam.origin and a unit is cam.scale px.
    const { scale, origin } = sampleDistributionCamera(smoother(c, PULL_BACK), size, PE_BA_BOUNDS);
    const half = Math.tan(MathUtils.degToRad(cam.fov) / 2);
    const height = size.height / 2 / (scale * half);
    target.set((size.width / 2 - origin.x) / scale, 0, (size.height / 2 - origin.y) / scale);
    cam.up.set(0, 0, -1);
    cam.position.set(target.x, height, target.z);
    cam.lookAt(target);
    dotMaterial.size = DOT / half;

    const map = smoother(c, MAP_IN);
    outlineMaterial.opacity = 0.35 * map;
    dotMaterial.opacity = map;
    ROUTES.forEach((route, i) => {
      const [start, end] = routeWindow(i);
      const f = MathUtils.clamp((c - start) / (end - start), 0, 1);
      const line = lines.current[i];
      if (line) {
        line.material.dashOffset = route.length * (1 - f);
        line.visible = f > 0;
      }
      // landed: the destination lights, a ring going out once
      const land = MathUtils.clamp((c - end) / LAND, 0, 1);
      destinationMaterials[i].opacity = land > 0 ? 1 : 0;
      dots.current[i]?.scale.setScalar(land > 0 ? 0.6 + 0.4 * MathUtils.smootherstep(land, 0, 0.4) : 0.001);
      ringMaterials[i].opacity = land > 0 && land < 1 ? 0.7 * (1 - land) : 0;
      rings.current[i]?.scale.setScalar(1 + 2.4 * land);
    });
  });

  return (
    <group>
      <Suspense fallback={null}>
        <Northeast />
      </Suspense>
      {ROUTES.map((route, i) => (
        <group key={i}>
          {/* Drawn from its hub: one dash the line's length, slid in by dashOffset. */}
          <Line
            ref={(l) => {
              lines.current[i] = l;
            }}
            points={route.points}
            color={RED}
            lineWidth={1.4}
            transparent
            opacity={0.85}
            dashed
            dashSize={route.length}
            gapSize={route.length}
            dashOffset={route.length}
            visible={false}
          />
          <mesh
            ref={(m) => {
              dots.current[i] = m;
            }}
            geometry={destinationGeometry}
            material={destinationMaterials[i]}
            position={route.to}
          />
          <mesh
            ref={(m) => {
              rings.current[i] = m;
            }}
            geometry={ringGeometry}
            material={ringMaterials[i]}
            position={route.to}
          />
        </group>
      ))}
    </group>
  );
}
