import { AdditiveBlending, InstancedMesh, type MeshStandardMaterial, PlaneGeometry, ShaderMaterial } from "three";
import { MAST_HEIGHT, MASTS } from "../models/terminalLayout";
import { skyUniforms } from "./skyShared";

// Yard lights (0–1), written per frame by the Terminal from sampleLight().lamps.
export const yardUniforms = { uLamps: { value: 0 } };

// Sodium vapor, #ffb46b in linear.
export const SODIUM_GLSL = "vec3(1.0, 0.456, 0.147)";

const masts = MASTS.map(([x, z]) => `vec3(${x.toFixed(2)}, ${MAST_HEIGHT}.0, ${z.toFixed(2)})`).join(", ");

// A faint warm cast from the nearest masts on faces turned toward them: Lambert to each mast head with an
// inverse-square-ish falloff, as emissive scaled by the albedo. No PointLights, eight masts baked in.
export function withYardLight<T extends MeshStandardMaterial>(material: T): T {
  const key = `yard|${material.customProgramCacheKey()}`;
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, yardUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vYardWorld;\nvarying vec3 vYardNormal;")
      .replace(
        "#include <project_vertex>",
        /* glsl */ `#include <project_vertex>
        vec4 yardPos = vec4(transformed, 1.0);
        vec3 yardNormal = objectNormal;
        #ifdef USE_INSTANCING
          yardPos = instanceMatrix * yardPos;
          yardNormal = mat3(instanceMatrix) * yardNormal;
        #endif
        vYardWorld = (modelMatrix * yardPos).xyz;
        vYardNormal = normalize(mat3(modelMatrix) * yardNormal);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>\nvarying vec3 vYardWorld;\nvarying vec3 vYardNormal;\nuniform float uLamps;\nconst vec3 YARD_MASTS[${MASTS.length}] = vec3[](${masts});`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        /* glsl */ `#include <emissivemap_fragment>
        if (uLamps > 0.0) {
          float yard = 0.0;
          for (int i = 0; i < ${MASTS.length}; i++) {
            vec3 toMast = YARD_MASTS[i] - vYardWorld;
            float d2 = dot(toMast, toMast);
            yard += max(dot(normalize(vYardNormal), toMast * inversesqrt(d2)), 0.0) * 500.0 / (d2 + 500.0);
          }
          totalEmissiveRadiance += diffuseColor.rgb * ${SODIUM_GLSL} * 0.35 * uLamps * yard;
        }`,
      );
  };
  return material;
}

// Sodium pools: additive quads on the ground under each lamp, soft radial falloff, faded by the fog; one shared
// material, lit by uLamps. The caller places the instances (the terminal's masts, the highway's poles).
const poolMaterial = new ShaderMaterial({
  uniforms: { ...yardUniforms, uFogDensity: skyUniforms.uFogDensity },
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv * 2.0 - 1.0;
      vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uLamps;
    uniform float uFogDensity;
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      float fall = pow(1.0 - smoothstep(0.0, 1.0, length(vUv)), 2.0);
      float d = distance(cameraPosition, vWorld);
      float seen = exp(-uFogDensity * uFogDensity * d * d);
      gl_FragColor = vec4(${SODIUM_GLSL} * 0.85 * uLamps * fall * seen, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});

export function createLampPools(radius: number, count: number) {
  return new InstancedMesh(new PlaneGeometry(radius * 2, radius * 2).rotateX(-Math.PI / 2), poolMaterial, count);
}
