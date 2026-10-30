"use client";

import { DoubleSide, PlaneGeometry, ShaderMaterial } from "three";
import { ink } from "./ink";

const SIZE = 1600;
const geometry = new PlaneGeometry(SIZE, SIZE).rotateX(-Math.PI / 2);

// The drawing board's grid on the ground: a line every 10 m and a stronger one every 50 m, at 5% (and 10%) of the
// stroke. In world space, so it slides under the camera with the scene; faded with distance, where it would
// only shimmer. Anti-aliased by screen-space derivatives.
const material = new ShaderMaterial({
  uniforms: { uStroke: ink.stroke },
  transparent: true,
  depthWrite: false,
  side: DoubleSide,
  vertexShader: /* glsl */ `
    varying vec3 vWorld;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uStroke;
    varying vec3 vWorld;
    float lines(vec2 p, float step) {
      vec2 g = abs(fract(p / step - 0.5) - 0.5) / fwidth(p / step);
      return 1.0 - min(min(g.x, g.y), 1.0);
    }
    void main() {
      vec2 p = vWorld.xz;
      float alpha = max(lines(p, 10.0) * 0.05, lines(p, 50.0) * 0.1);
      alpha *= 1.0 - smoothstep(200.0, 700.0, distance(cameraPosition, vWorld));
      gl_FragColor = vec4(uStroke, alpha);
      #include <colorspace_fragment>
    }
  `,
});

export function Grid({ y = 0 }: { y?: number }) {
  return <mesh geometry={geometry} material={material} position-y={y} renderOrder={-1} />;
}
