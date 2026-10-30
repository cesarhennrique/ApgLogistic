import { SceneImage } from "./SceneImage";

// The ocean seen from above, full screen. The hero fades it in at the end of its dive and scene 1 opens on it:
// both start from this transform, so the hand-over is the same picture. Over scene 1 it settles to scale 1 while
// drifting down (the water flowing past the ship): the drift is the margin the scale leaves, so no edge shows.
export const OCEAN_SCALE = 1.08;
export const oceanTransform = (settle: number) => {
  const scale = OCEAN_SCALE + (1 - OCEAN_SCALE) * settle;
  return `translate3d(0, ${(-(scale - 1) * 50).toFixed(3)}%, 0) scale(${scale.toFixed(4)})`;
};

export function Ocean() {
  return (
    <SceneImage
      name="oceano-cima"
      alt=""
      sizes="100vw"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
