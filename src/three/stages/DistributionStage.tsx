"use client";

import { MAP_ORIGIN } from "../models/distributionLayout";
import { Distribution } from "../scene/Distribution";
import type { CameraKey } from "./heroCamera";

// Its camera from above, zooming out from Suape to the whole of PE and BA (Suape on the stage's origin).
export const keys = {
  start: { position: [-6, 45, 22], target: [-2, 0, 2], fov: 34 },
  mid: { position: [-40, 120, 75], target: [-38, 0, 40], fov: 34 },
  end: { position: [-70, 210, 110], target: [-70, 0, 54], fov: 34 },
} satisfies Record<string, CameraKey>;

// Scene 6 (from above, zooming out): Suape's warehouse on the PE/BA map, the vans fanning out. Shifted so Suape
// sits on the stage's origin. shortcut: kept for the J4 distribution scene, not mounted yet.
export function DistributionStage({ progress }: { progress: { value: number } }) {
  return (
    <group position={[-MAP_ORIGIN.x, 0, -MAP_ORIGIN.z]}>
      <Distribution progress={progress} />
    </group>
  );
}
