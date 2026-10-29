"use client";

import { Billboard, Line, Text } from "@react-three/drei";
import { useFrame, useLoader } from "@react-three/fiber";
import { type ComponentRef, Suspense, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  FileLoader,
  LineBasicMaterial,
  MathUtils,
  type Mesh,
  MeshBasicMaterial,
  type PerspectiveCamera,
  PointsMaterial,
  RingGeometry,
} from "three";
import { site } from "@/content/site";
import { HERO_ROUTES, SALVADOR_HERO, buildDots, parseStates, toHero } from "../models/heroMapLayout";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.hero;

const SAND = "#f3efe7";
// Red-500, pushed past 1 so the bloom picks up the travelling glow (and only that).
const RED = "#e31e24";
const RED_HOT = new Color(3.2, 0.42, 0.45);

const outlineMaterial = new LineBasicMaterial({ color: SAND, transparent: true, opacity: 0.35, depthWrite: false });
// Dots sized in the map's own units (a third of the 0.7 grid step), so they never merge on small screens. The
// attenuated size ignores the fov, so the frame divides it back in (DOT / tan(fov / 2)).
const DOT = 0.24;
const dotMaterial = new PointsMaterial({ size: DOT, vertexColors: true });

function Northeast() {
  const svg = useLoader(FileLoader, "/images/map/nordeste.svg") as string;
  const { outlines, dots } = useMemo(() => {
    const states = parseStates(svg);
    // Outlines as line segments, ring by ring.
    const segments: number[] = [];
    for (const rings of Object.values(states))
      for (const ring of rings)
        for (let i = 0; i < ring.length; i++) {
          const a = toHero(...ring[i]);
          const b = toHero(...ring[(i + 1) % ring.length]);
          segments.push(a.x, 0, a.z, b.x, 0, b.z);
        }
    const outlines = new BufferGeometry().setAttribute("position", new BufferAttribute(new Float32Array(segments), 3));
    const grid = buildDots(states);
    const dots = new BufferGeometry()
      .setAttribute("position", new BufferAttribute(grid.positions, 3))
      .setAttribute("color", new BufferAttribute(grid.colors, 3));
    return { outlines, dots };
  }, [svg]);
  return (
    <>
      <lineSegments geometry={outlines} material={outlineMaterial} />
      <points geometry={dots} material={dotMaterial} />
    </>
  );
}

const ROUTE_POINTS = HERO_ROUTES.map((r) => r.getPoints(64));
const ROUTE_LENGTHS = HERO_ROUTES.map((r) => r.getLength());
// The glow: one dash a sixth of the route long, crossing it every 3.2 s, the routes out of step.
const GLOW = { share: 0.16, period: 3.2 };

// Suape's beat: a ring that grows and fades every 2.4 s.
const PULSE = 2.4;
const ringMaterial = new MeshBasicMaterial({ color: RED, transparent: true, depthWrite: false });
const ringGeometry = new RingGeometry(0.55, 0.75, 48).rotateX(-Math.PI / 2);
const coreGeometry = new CircleGeometry(0.45, 32).rotateX(-Math.PI / 2);
const coreMaterial = new MeshBasicMaterial({ color: RED });

function Label({ at, text }: { at: [number, number, number]; text: string }) {
  return (
    <Billboard position={at}>
      <Text
        font="/3d/fonts/archivo-bold.ttf"
        fontSize={1.25}
        letterSpacing={0.14}
        anchorX="left"
        anchorY="middle"
        color={SAND}
        fillOpacity={0.85}
      >
        {text}
      </Text>
    </Billboard>
  );
}

// Chapter 0: the Northeast coast as a tilted map of lines and dots, cabotage routes arcing in from the sea onto
// Suape, which beats.
export function HeroMapStage({ reducedMotion }: { reducedMotion: boolean }) {
  const glows = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const ring = useRef<Mesh>(null);

  useFrame(({ camera, clock }) => {
    dotMaterial.size = DOT / Math.tan(MathUtils.degToRad((camera as PerspectiveCamera).fov) / 2);
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    glows.current.forEach((line, i) => {
      if (!line) return;
      const length = ROUTE_LENGTHS[i];
      const dash = length * GLOW.share;
      // From just before the start to the end, then again.
      const travel = (((t / GLOW.period + i * 0.23) % 1) * (length + dash)) - dash;
      line.material.dashOffset = -travel;
    });
    const phase = (t % PULSE) / PULSE;
    ring.current!.scale.setScalar(1 + 4 * phase);
    ringMaterial.opacity = 1 - phase;
  });

  return (
    <group>
      <Suspense fallback={null}>
        <Northeast />
      </Suspense>
      {ROUTE_POINTS.map((points, i) => (
        <group key={i}>
          <Line points={points} color={RED} lineWidth={1.4} transparent opacity={0.55} />
          {!reducedMotion && (
            <Line
              ref={(l) => {
                glows.current[i] = l;
              }}
              points={points}
              color={RED_HOT}
              lineWidth={2.6}
              dashed
              dashSize={ROUTE_LENGTHS[i] * GLOW.share}
              gapSize={ROUTE_LENGTHS[i]}
              dashOffset={ROUTE_LENGTHS[i] * GLOW.share}
            />
          )}
        </group>
      ))}
      <mesh geometry={coreGeometry} material={coreMaterial} position-y={0.02} />
      <mesh ref={ring} geometry={ringGeometry} material={ringMaterial} position-y={0.02} visible={!reducedMotion} />
      <Label at={[1.4, 0.6, -1.2]} text={site.journeyScene.mapLabels.suape} />
      <Label at={[SALVADOR_HERO.x + 1.2, 0.6, SALVADOR_HERO.z]} text={site.journeyScene.mapLabels.salvador} />
    </group>
  );
}
