"use client";

import { Decal, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  ConeGeometry,
  type Group,
  InstancedMesh,
  MathUtils,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  type SpotLight,
  Vector3,
} from "three";
import { TRUCK_LOAD_POINT } from "../anchors";
import { CAB, GROUND_Y, HEADLIGHTS, WHEEL_Y, WHEELS, buildTruckGeometry } from "../models/truckGeometry";
import { journeyProgress } from "../progress";
import { GlbOr } from "./GlbModel";
import { lostInFog, skyUniforms, withSkyFog } from "./skyShared";

const truck = buildTruckGeometry();

const paint = withSkyFog(new MeshStandardMaterial({ color: "#edebe6", roughness: 0.45, metalness: 0.1 }));
const navy = withSkyFog(new MeshStandardMaterial({ color: "#1a2350", roughness: 0.5 }));
const red = withSkyFog(new MeshStandardMaterial({ color: "#e31e24", roughness: 0.5 }));
const dark = withSkyFog(new MeshStandardMaterial({ color: "#2a2d33", roughness: 0.6, metalness: 0.3 }));
const metal = withSkyFog(new MeshStandardMaterial({ color: "#b8bcc2", roughness: 0.3, metalness: 0.85 }));
// Dark glass: almost all reflection, so it picks up the sky from the environment.
const glass = withSkyFog(new MeshStandardMaterial({ color: "#0b0f18", roughness: 0.06, metalness: 0.95 }));
const headlamps = withSkyFog(
  new MeshStandardMaterial({ color: "#d9dde3", emissive: "#fff3dd", emissiveIntensity: 0, roughness: 0.2 }),
);
const amber = withSkyFog(new MeshStandardMaterial({ color: "#5a3a10", emissive: "#ffab2e", emissiveIntensity: 0 }));
const rubber = withSkyFog(new MeshStandardMaterial({ color: "#1a1b1e", roughness: 0.9 }));
const rimPaint = withSkyFog(new MeshStandardMaterial({ color: "#8e939a", roughness: 0.4, metalness: 0.6 }));
const decalMaterial = withSkyFog(new MeshStandardMaterial({ roughness: 0.5 }));

// Headlights come on around 0.45 (leaving for the road at dusk).
const LIGHTS_ON = [0.43, 0.46] as const;
const BEAM = { length: 14, radius: 3.2 };

// Fake volumetric beam: an open cone from the lamp, additive, fading along its length and toward its
// silhouette edges, and into the fog.
const beamMaterial = new ShaderMaterial({
  uniforms: { uOn: { value: 0 }, uFogDensity: skyUniforms.uFogDensity },
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexShader: /* glsl */ `
    varying float vAlong;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vWorld;
    void main() {
      vAlong = position.z / ${BEAM.length.toFixed(1)};
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      vec4 mv = viewMatrix * world;
      vView = -mv.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uOn;
    uniform float uFogDensity;
    varying float vAlong;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vWorld;
    void main() {
      float facing = abs(dot(normalize(vNormal), normalize(vView)));
      float along = pow(1.0 - clamp(vAlong, 0.0, 1.0), 2.0);
      float d = distance(cameraPosition, vWorld);
      float seen = exp(-uFogDensity * uFogDensity * d * d);
      gl_FragColor = vec4(vec3(1.0, 0.93, 0.8) * 0.25 * uOn * along * facing * facing * seen, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
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
  const y = (GROUND_Y + 3.0 + GROUND_Y + 2.38) / 2;
  return (
    <>
      {[-1, 1].map((s) => (
        <Decal
          key={s}
          map={logo}
          material={decalMaterial}
          position={[s * CAB.halfWidth, y, 8.75]}
          rotation={[0, (s * Math.PI) / 2, 0]}
          scale={[1.15, 0.68, 0.5]}
        />
      ))}
    </>
  );
}

function ProceduralCab() {
  return (
    <>
      <mesh geometry={truck.cab} material={paint} castShadow receiveShadow>
        <Suspense fallback={null}>
          <DoorLogos />
        </Suspense>
      </mesh>
      <mesh geometry={truck.paint} material={paint} castShadow />
      <mesh geometry={truck.navy} material={navy} />
      <mesh geometry={truck.red} material={red} />
      <mesh geometry={truck.glass} material={glass} />
      <mesh geometry={truck.headlights} material={headlamps} />
      <mesh geometry={truck.amber} material={amber} />
    </>
  );
}

// The spotlights' targets, on the road ahead of each lamp.
const targets = HEADLIGHTS.map((h) => {
  const o = new Object3D();
  o.position.copy(h).add(new Vector3(0, -1.2, 20));
  return o;
});

// The APG tractor and skeletal trailer, parked in the crane's lane; the box lands on its twist locks.
export function Truck() {
  const group = useRef<Group>(null);
  const spots = useRef<(SpotLight | null)[]>([]);
  const wheelMeshes = useMemo(() => [wheels(truck.tire, rubber), wheels(truck.rim, rimPaint)], []);

  useFrame(({ camera }) => {
    group.current!.visible = !lostInFog(camera.position, TRUCK_LOAD_POINT, 16);
    const on = MathUtils.smoothstep(journeyProgress.value, ...LIGHTS_ON);
    beamMaterial.uniforms.uOn.value = on;
    headlamps.emissiveIntensity = on * 6;
    amber.emissiveIntensity = on * 3;
    // Always mounted (0 when off): adding or removing lights would recompile every lit material.
    for (const s of spots.current) if (s) s.intensity = on * 60;
  });

  return (
    <group ref={group} position={TRUCK_LOAD_POINT}>
      <GlbOr url={process.env.NEXT_PUBLIC_TRUCK_CAB_GLB}>
        <ProceduralCab />
      </GlbOr>
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
            ref={(s) => {
              spots.current[i] = s;
            }}
            position={h}
            target={targets[i]}
            intensity={0}
            distance={50}
            angle={0.42}
            penumbra={0.7}
            decay={1.2}
            color="#fff1d6"
          />
          <mesh geometry={beamGeometry} material={beamMaterial} position={h} rotation-x={0.06} frustumCulled={false} />
        </group>
      ))}
    </group>
  );
}
