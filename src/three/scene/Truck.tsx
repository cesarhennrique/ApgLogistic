"use client";

import { Decal, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  ConeGeometry,
  type Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { TRAILER_BED_HEIGHT, TRUCK_LOAD_POINT } from "../anchors";
import { LIFT_DONE } from "../craneMotion";
import { HIGHWAY } from "../models/highwayLayout";
import { getContainerGeometry, getStripeGeometry } from "../models/containerGeometry";
import { CAB, GROUND_Y, HEADLIGHTS, WHEEL_Y, WHEELS, buildTruckGeometry } from "../models/truckGeometry";
import { journeyProgress } from "../progress";
import { apgBoxMaterial, stripeMaterial } from "./ContainerStacks";
import { GlbOr } from "./GlbModel";

const truck = buildTruckGeometry();

const paint = new MeshStandardMaterial({ color: "#edebe6", roughness: 0.45, metalness: 0.1 });
const navy = new MeshStandardMaterial({ color: "#1a2350", roughness: 0.5 });
const red = new MeshStandardMaterial({ color: "#e31e24", roughness: 0.5 });
const dark = new MeshStandardMaterial({ color: "#2a2d33", roughness: 0.6, metalness: 0.3 });
const metal = new MeshStandardMaterial({ color: "#b8bcc2", roughness: 0.3, metalness: 0.85 });
// Glass: a dim cab interior painted behind it (dashboard, the steering wheel and seat backs in silhouette)
// under the studio's reflection and a fresnel sheen, so it is never a flat black hole.
const WINDSHIELD = { y0: GROUND_Y + 2.45, wheelX: 0.55 };
const glass = new MeshStandardMaterial({ roughness: 0.06, metalness: 0.45 });
glass.customProgramCacheKey = () => "truck-glass";
glass.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vGlassLocal;\nvarying vec3 vGlassNormal;")
    .replace("#include <begin_vertex>", "#include <begin_vertex>\nvGlassLocal = position;\nvGlassNormal = normal;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying vec3 vGlassLocal;\nvarying vec3 vGlassNormal;")
    .replace(
      "#include <color_fragment>",
      /* glsl */ `#include <color_fragment>
      bool front = abs(vGlassNormal.z) > 0.5;
      vec2 q = front ? vGlassLocal.xy : vGlassLocal.zy;
      float y0 = ${WINDSHIELD.y0.toFixed(3)};
      vec3 interior = vec3(0.016, 0.018, 0.024);
      // Seat backs, then the dashboard along the bottom; the wheel on the driver's side (the truck's left, +X).
      float seats = front ? step(abs(abs(q.x) - 0.55), 0.3) * step(q.y, y0 + 0.75) : 0.0;
      interior = mix(interior, vec3(0.032, 0.033, 0.038), seats);
      interior = mix(interior, vec3(0.05, 0.05, 0.055), 1.0 - smoothstep(y0 + 0.2, y0 + 0.28, q.y));
      float ring = front ? smoothstep(0.035, 0.0, abs(length(q - vec2(${WINDSHIELD.wheelX.toFixed(2)}, y0 + 0.42)) - 0.21)) : 0.0;
      diffuseColor.rgb = mix(interior, vec3(0.004), ring);`,
    )
    .replace(
      "#include <emissivemap_fragment>",
      /* glsl */ `#include <emissivemap_fragment>
      vec3 toEye = normalize(vViewPosition);
      float fresnel = 0.06 + 0.94 * pow(1.0 - clamp(dot(normal, toEye), 0.0, 1.0), 4.0);
      totalEmissiveRadiance += vec3(0.62, 0.66, 0.74) * fresnel * 0.35;`,
    );
};
const rubber = new MeshStandardMaterial({ color: "#1a1b1e", roughness: 0.9 });
const rimPaint = new MeshStandardMaterial({ color: "#8e939a", roughness: 0.4, metalness: 0.6 });
const decalMaterial = new MeshStandardMaterial({ roughness: 0.5 });

// A camera-facing additive glow, for the lamps (the bloom of Prompt 15 builds on it).
function glowMaterial(hex: string, size: number, on: number) {
  return new ShaderMaterial({
    uniforms: { uOn: { value: on }, uColor: { value: new Color(hex) } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = position.xy * 2.0;
        vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        mv.xy += position.xy * ${size.toFixed(2)};
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOn;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float f = pow(max(1.0 - length(vUv), 0.0), 2.5);
        gl_FragColor = vec4(uColor * f * uOn, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
const glowQuad = new PlaneGeometry(1, 1);
const AMBER_SPOTS = [-1, 1].flatMap((s) => [
  new Vector3(s * 1.08, GROUND_Y + 4.0, 9.6),
  new Vector3(s * 1.28, GROUND_Y + 0.65, 5.8),
]);

const BEAM = { length: 14, radius: 3.2 };

// Fake volumetric beam: an open cone from the lamp, additive, fading along its length and toward its
// silhouette edges.
function beamMaterial(on: number) {
  return new ShaderMaterial({
    uniforms: { uOn: { value: on } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vAlong = position.z / ${BEAM.length.toFixed(1)};
        vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
        vView = -mv.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOn;
      varying float vAlong;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vView)));
        float along = pow(1.0 - clamp(vAlong, 0.0, 1.0), 2.0);
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * 0.25 * uOn * along * facing * facing, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
// Apex at the lamp, opening forward (+Z), dipped slightly toward the road.
const beamGeometry = new ConeGeometry(BEAM.radius, BEAM.length, 20, 1, true)
  .rotateX(-Math.PI / 2)
  .translate(0, 0, BEAM.length / 2);

function wheels(geometry: InstancedMesh["geometry"], material: MeshStandardMaterial) {
  const mesh = new InstancedMesh(geometry, material, WHEELS.length);
  const o = new Object3D();
  WHEELS.forEach(([x, z], i) => {
    o.position.set(x, WHEEL_Y, z);
    o.updateMatrix();
    mesh.setMatrixAt(i, o.matrix);
  });
  mesh.computeBoundingSphere();
  mesh.castShadow = true;
  return mesh;
}

// The APG logo on both doors, between the navy band and the side window.
function DoorLogos() {
  const logo = useTexture("/3d/textures/apg-decal.webp");
  // Between the navy band (top at 1.85) and the side window (bottom at 2.6).
  const y = GROUND_Y + 2.22;
  return (
    <>
      {[-1, 1].map((s) => (
        <Decal
          key={s}
          map={logo}
          material={decalMaterial}
          position={[s * CAB.halfWidth, y, 8.7]}
          rotation={[0, (s * Math.PI) / 2, 0]}
          scale={[1.0, 0.6, 0.5]}
        />
      ))}
    </>
  );
}

function ProceduralCab({ lamps }: { lamps: Lamps }) {
  return (
    <>
      <mesh geometry={truck.cab} material={paint} castShadow receiveShadow>
        <Suspense fallback={null}>
          <DoorLogos />
        </Suspense>
      </mesh>
      <mesh geometry={truck.deflector} material={paint} castShadow />
      <mesh geometry={truck.paint} material={paint} castShadow />
      <mesh geometry={truck.navy} material={navy} />
      <mesh geometry={truck.red} material={red} />
      <mesh geometry={truck.glass} material={glass} />
      <mesh geometry={truck.headlights} material={lamps.head} />
      <mesh geometry={truck.amber} material={lamps.amber} />
    </>
  );
}

// The spotlights' targets, on the road ahead of each lamp.
const targets = HEADLIGHTS.map((h) => {
  const o = new Object3D();
  o.position.copy(h).add(new Vector3(0, -1.2, 20));
  return o;
});

// Lit on the night road, dark in the port's daylight studio. Fixed per mode, so nothing changes per frame.
const lampSet = (on: number) => ({
  head: new MeshStandardMaterial({ color: "#d9dde3", emissive: "#fff3dd", emissiveIntensity: on * 6, roughness: 0.2 }),
  amber: new MeshStandardMaterial({ color: "#5a3a10", emissive: "#ffab2e", emissiveIntensity: on * 3 }),
  beam: beamMaterial(on),
  headGlow: glowMaterial("#fff1d6", 1.8, on),
  amberGlow: glowMaterial("#ffab2e", 0.7, on),
  spot: on * 60,
});
const LAMPS = { port: lampSet(0), road: lampSet(1) };
type Lamps = (typeof LAMPS)["port"];

export type TruckMode = "port" | "road";
// On the highway stage: the truck lane, wheels on the road.
const ROAD_POINT = new Vector3(0, HIGHWAY.roadY + TRAILER_BED_HEIGHT, HIGHWAY.truckLaneZ);

// The APG tractor and skeletal trailer. "port": parked in the crane's lane, cab toward -Z, lamps off; the box
// appears on its twist locks the moment it lands (0.4). "road": on the highway stage in profile, heading +X,
// lamps on, loaded.
export function Truck({ mode }: { mode: TruckMode }) {
  const box = useRef<Group>(null);
  const wheelMeshes = useMemo(() => [wheels(truck.tire, rubber), wheels(truck.rim, rimPaint)], []);
  const lamps = LAMPS[mode];
  const place =
    mode === "port"
      ? { position: TRUCK_LOAD_POINT, yaw: Math.PI }
      : { position: ROAD_POINT, yaw: Math.PI / 2 };

  useFrame(() => {
    // From the moment it lands the box is the truck's: the crane hides its own copy.
    if (mode === "port") box.current!.visible = journeyProgress.value >= LIFT_DONE;
  });

  return (
    <group position={place.position} rotation-y={place.yaw}>
      <GlbOr url={process.env.NEXT_PUBLIC_TRUCK_CAB_GLB}>
        <ProceduralCab lamps={lamps} />
      </GlbOr>
      <group ref={box} visible={mode === "road"}>
        <mesh geometry={getContainerGeometry("40")} material={apgBoxMaterial} castShadow receiveShadow />
        <mesh geometry={getStripeGeometry("40")} material={stripeMaterial} />
      </group>
      <mesh geometry={truck.dark} material={dark} castShadow receiveShadow />
      <mesh geometry={truck.metal} material={metal} castShadow />
      <mesh geometry={truck.trailer} material={dark} castShadow receiveShadow />
      {wheelMeshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
      {HEADLIGHTS.map((h, i) => (
        <group key={i}>
          <primitive object={targets[i]} />
          <spotLight
            position={h}
            target={targets[i]}
            intensity={lamps.spot}
            distance={50}
            angle={0.42}
            penumbra={0.7}
            decay={1.2}
            color="#fff1d6"
          />
          <mesh geometry={beamGeometry} material={lamps.beam} position={h} rotation-x={0.06} frustumCulled={false} />
          <mesh geometry={glowQuad} material={lamps.headGlow} position={[h.x, h.y, h.z + 0.08]} frustumCulled={false} />
        </group>
      ))}
      {AMBER_SPOTS.map((a, i) => (
        <mesh key={i} geometry={glowQuad} material={lamps.amberGlow} position={a} frustumCulled={false} />
      ))}
    </group>
  );
}
