"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import {
  BoxGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  type Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { site } from "@/content/site";
import { CRUISE, HIGHWAY, loopX } from "../models/highwayLayout";
import { journeyProgress } from "../progress";
import { inView } from "../stages/inView";
import { createLampPools } from "./yardLight";

const {
  x: hx,
  z: hz,
  length: L,
  roadY,
  lane,
  median,
  shoulder,
  verge,
} = HIGHWAY;
const carriageway = 2 * lane;
// Half-width of the paved road (median + carriageway + shoulder), then the grass verges beyond it.
const PAVED = median + carriageway + shoulder;
const HALF = PAVED + verge;

// Asphalt, shoulders, grass and paint, all in the shader; uScroll slides it under the standing truck.
const groundUniforms = { uScroll: { value: 0 } };
const groundMaterial = new MeshStandardMaterial({ roughness: 0.92 });
groundMaterial.customProgramCacheKey = () => "br101-ground";
groundMaterial.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, groundUniforms);
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec2 vRoad;")
    .replace(
      "#include <project_vertex>",
      "#include <project_vertex>\nvec4 roadWorld = modelMatrix * vec4(transformed, 1.0);\nvRoad = roadWorld.xz;",
    );
  shader.fragmentShader = shader.fragmentShader
    .replace(
      "#include <common>",
      /* glsl */ `#include <common>
      varying vec2 vRoad;
      uniform float uScroll;
      float rHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float rNoise(vec2 p) {
        vec2 i = floor(p); vec2 u = fract(p); u = u * u * (3.0 - 2.0 * u);
        return mix(mix(rHash(i), rHash(i + vec2(1, 0)), u.x), mix(rHash(i + vec2(0, 1)), rHash(i + vec2(1, 1)), u.x), u.y);
      }
      // 1 on a line of width w at z0; dashed: 4 m painted, 8 m gap.
      float paintLine(float z, float z0, float w, float x, bool dashed) {
        float on = step(abs(z - z0), w * 0.5);
        return dashed ? on * step(fract(x / 12.0), 0.333) : on;
      }`,
    )
    .replace(
      "#include <color_fragment>",
      /* glsl */ `#include <color_fragment>
      float x = vRoad.x + uScroll;
      float z = vRoad.y - ${hz.toFixed(2)};
      float az = abs(z);
      float grain = 0.6 * rNoise(vec2(x, z) * 1.7) + 0.4 * rNoise(vec2(x, z) * 6.3);
      // Asphalt (darker in the wheel tracks), lighter shoulders, grass median and verges.
      vec3 asphalt = vec3(0.034, 0.035, 0.04) * (0.75 + 0.5 * grain);
      vec3 shoulderTone = asphalt * 1.5;
      vec3 grass = vec3(0.03, 0.05, 0.022) * (0.6 + 0.8 * rNoise(vec2(x, z) * 0.35)) * (0.8 + 0.4 * grain);
      vec3 col = az < ${median.toFixed(2)} ? grass : az < ${(median + carriageway).toFixed(2)} ? asphalt : az < ${PAVED.toFixed(2)} ? shoulderTone : grass;
      // Paint, per carriageway: yellow on the median side, white dashed between lanes, white on the outside.
      float inner = paintLine(az, ${(median + 0.15).toFixed(2)}, 0.15, x, false);
      float divider = paintLine(az, ${(median + lane).toFixed(2)}, 0.15, x, true);
      float outer = paintLine(az, ${(median + carriageway - 0.15).toFixed(2)}, 0.15, x, false);
      col = mix(col, vec3(0.9, 0.62, 0.08), inner * 0.85);
      col = mix(col, vec3(0.85), max(divider, outer) * 0.85);
      diffuseColor.rgb = col;`,
    );
};

const steel = new MeshStandardMaterial({ color: "#a9adb3", roughness: 0.45, metalness: 0.7 });
// The poles are lit: this stage is the night drive.
const poleLamp = new MeshStandardMaterial({ color: "#2b2b2b", emissive: "#ffb46b", emissiveIntensity: 4, roughness: 0.4 });
const foliage = new MeshStandardMaterial({ roughness: 0.85 });
// DNIT direction-sign green with a white border; the text is white.
const signGreen = new MeshStandardMaterial({ color: "#006b3f", roughness: 0.6 });
const signWhite = new MeshStandardMaterial({ color: "#f2f2f2", roughness: 0.6 });
const signText = new MeshBasicMaterial({ color: "#ffffff" });

// Guard rails: the median's and each outer edge's; the beams are continuous, only the posts scroll.
const RAIL_Z = [
  hz,
  hz + median + carriageway + shoulder - 0.4,
  hz - (median + carriageway + shoulder - 0.4),
];
const POST_PITCH = 4;
const POLE_PITCH = 50;
const POLE_HEIGHT = 11;

type Instanced = {
  mesh: InstancedMesh;
  spots: { x0: number; y: number; z: number; ry: number; s: number }[];
};

function scrolled(
  geometry: InstancedMesh["geometry"],
  material: MeshStandardMaterial,
  spots: Instanced["spots"],
  colors?: Color[],
) {
  const mesh = new InstancedMesh(geometry, material, spots.length);
  colors?.forEach((c, i) => mesh.setColorAt(i, c));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // The strip never leaves the frame as a whole; skip per-frame bounds.
  mesh.frustumCulled = false;
  return { mesh, spots };
}

function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function buildProps() {
  const from = hx - L / 2;
  const posts = scrolled(
    new BoxGeometry(0.16, 0.9, 0.16).translate(0, 0.45, 0),
    steel,
    RAIL_Z.flatMap((z) =>
      Array.from({ length: L / POST_PITCH }, (_, i) => ({
        x0: from + i * POST_PITCH,
        y: roadY,
        z,
        ry: 0,
        s: 1,
      })),
    ),
  );
  // Median poles with two arms, one over each carriageway.
  const poleGeometry = mergeGeometries([
    new CylinderGeometry(0.12, 0.2, POLE_HEIGHT, 8).translate(
      0,
      POLE_HEIGHT / 2,
      0,
    ),
    new BoxGeometry(0.12, 0.12, 7).translate(0, POLE_HEIGHT, 0),
  ])!;
  const poleSpots = Array.from({ length: L / POLE_PITCH }, (_, i) => ({
    x0: from + i * POLE_PITCH,
    y: roadY,
    z: hz,
    ry: 0,
    s: 1,
  }));
  const poles = scrolled(poleGeometry, steel, poleSpots);
  const lampHeads = scrolled(
    mergeGeometries(
      [-1, 1].map((s) =>
        new BoxGeometry(0.5, 0.18, 1.0).translate(
          0,
          POLE_HEIGHT - 0.12,
          s * 3.3,
        ),
      ),
    )!,
    poleLamp,
    poleSpots,
  );
  // Low, stylized vegetation on the verges: cone trees and round shrubs, a few greens.
  const random = rng(101);
  const greens = ["#2f4a2a", "#3b5a2e", "#26402a", "#4a6033"].map(
    (c) => new Color(c),
  );
  const verges = (count: number) =>
    Array.from({ length: count }, () => {
      const side = random() < 0.5 ? -1 : 1;
      const z = hz + side * (PAVED + 2 + random() * (verge - 4));
      return {
        x0: from + random() * L,
        y: roadY,
        z,
        ry: random() * Math.PI,
        s: 0.6 + random() * 0.9,
      };
    });
  const trees = scrolled(
    new ConeGeometry(1.6, 5, 7).translate(0, 2.5, 0),
    foliage,
    verges(110),
    Array.from({ length: 110 }, () => greens[Math.floor(random() * 4)]),
  );
  const shrubs = scrolled(
    new IcosahedronGeometry(1.1, 0).translate(0, 0.6, 0),
    foliage,
    verges(170),
    Array.from({ length: 170 }, () => greens[Math.floor(random() * 4)]),
  );
  return [posts, poles, lampHeads, trees, shrubs];
}

const props = buildProps();
// Two pools per pole, one on each carriageway.
const pools = createLampPools(12, props[1].spots.length * 2);
pools.frustumCulled = false;
const dummy = new Object3D();

// The sign: on the truck's verge, ahead, turned toward the travelling camera so it reads.
const SIGN = {
  x0: hx + 40,
  z: hz + PAVED + 3,
  width: 7.4,
  height: 2.2,
  y: 5.4,
};

// BR-101 at night: the APG truck stands in its lane while the road, posts, poles and trees loop past.
export function Highway({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const sign = useRef<Group>(null);
  // The sign's text (troika: a font fetch and a worker) mounts only once the road is near, not on page load.
  const [near, setNear] = useState(false);

  useFrame(({ clock }) => {
    const p = journeyProgress.value;
    if (!near && p > 0.3) setNear(true);
    // Only while its stage is on screen (StageDirector hides the rest).
    if (!inView(group.current!)) return;
    const scroll = reducedMotion ? 0 : CRUISE * clock.elapsedTime;
    groundUniforms.uScroll.value = scroll % 1200;

    for (const { mesh, spots } of props) {
      spots.forEach((s, i) => {
        dummy.position.set(loopX(s.x0, scroll), s.y, s.z);
        dummy.rotation.set(0, s.ry, 0);
        dummy.scale.setScalar(s.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    props[1].spots.forEach((s, i) => {
      for (const side of [-1, 1]) {
        dummy.position.set(
          loopX(s.x0, scroll),
          roadY + 0.03,
          hz + side * (median + lane),
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        pools.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), dummy.matrix);
      }
    });
    pools.instanceMatrix.needsUpdate = true;
    sign.current!.position.x = loopX(SIGN.x0, scroll);
  });

  return (
    <group ref={group}>
      <mesh
        material={groundMaterial}
        rotation-x={-Math.PI / 2}
        position={[hx, roadY, hz]}
        receiveShadow
      >
        <planeGeometry args={[L, HALF * 2]} />
      </mesh>
      {RAIL_Z.map((z) => (
        <mesh
          key={z}
          material={steel}
          position={[hx, roadY + 0.75, z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[L, 0.32, 0.08]} />
        </mesh>
      ))}
      {props.map(({ mesh }) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
      <primitive object={pools} />

      <group ref={sign} position={[SIGN.x0, roadY, SIGN.z]} rotation-y={-0.75}>
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            material={steel}
            position={[
              s * (SIGN.width / 2 - 0.6),
              (SIGN.y + SIGN.height) / 2,
              -0.1,
            ]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.1, SIGN.y + SIGN.height, 8]} />
          </mesh>
        ))}
        <mesh material={signWhite} position={[0, SIGN.y, 0]} castShadow>
          <boxGeometry args={[SIGN.width + 0.2, SIGN.height + 0.2, 0.06]} />
        </mesh>
        <mesh material={signGreen} position={[0, SIGN.y, 0.035]}>
          <boxGeometry args={[SIGN.width, SIGN.height, 0.02]} />
        </mesh>
        {near && (
          <Text
            font="/3d/fonts/archivo-bold.ttf"
            fontSize={0.95}
            anchorX="center"
            anchorY="middle"
            position={[0, SIGN.y, 0.06]}
            // troika derives its own material from this one, so the scene's fog carries over.
            material={signText}
          >
            {site.journeyScene.highwaySign}
          </Text>
        )}
      </group>
    </group>
  );
}
