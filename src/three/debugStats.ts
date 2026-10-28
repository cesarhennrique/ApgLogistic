// Numbers for the ?debug panel, written from inside the canvas and polled by the DOM panel.
export const debugStats = {
  // renderer.info after the last frame (the shadow pass included).
  triangles: 0,
  calls: 0,
  // Last environment bake: the cube render plus the frame that rebuilds the PMREM.
  bakeMs: null as number | null,
};
