import { AdditiveBlending, InstancedMesh, PlaneGeometry, ShaderMaterial } from "three";

// Sodium vapor, #ffb46b in linear.
const SODIUM_GLSL = "vec3(1.0, 0.456, 0.147)";

// Sodium pools: additive quads on the ground under each lamp, soft radial falloff. The caller places the
// instances (the highway's poles).
const poolMaterial = new ShaderMaterial({
  uniforms: { uIntensity: { value: 0.85 } },
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv * 2.0 - 1.0;
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform float uIntensity;
    varying vec2 vUv;
    void main() {
      float fall = pow(1.0 - smoothstep(0.0, 1.0, length(vUv)), 2.0);
      gl_FragColor = vec4(${SODIUM_GLSL} * uIntensity * fall, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});

export function createLampPools(radius: number, count: number) {
  return new InstancedMesh(new PlaneGeometry(radius * 2, radius * 2).rotateX(-Math.PI / 2), poolMaterial, count);
}
