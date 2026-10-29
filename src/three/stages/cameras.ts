import type { ChapterId } from "../chapters";

type V3 = [number, number, number];
export type CameraKey = { position: V3; target: V3; fov: number };
export type StageCameras = { start: CameraKey; mid: CameraKey; end: CameraKey };

// Each stage's camera at the start, middle and end of its span, in the stage's own frame (its origin is the
// stage's subject: Suape on the hero map, the crane's base, the truck, the terminal's center, Suape on the PE/BA
// map). shortcut: first-pass framing; Prompts 13b–13d direct each shot.
export const STAGE_CAMERAS: Record<ChapterId, StageCameras> = {
  // The Northeast map, seen ~35° above its plane from the south (north up), aimed at its middle. At runtime the
  // start is refitted to the viewport beside (or above) the copy (CameraRig, heroFrame). Then the dive to Suape.
  hero: {
    start: { position: [-30, 86, 129.4], target: [-30, 0, 6.5], fov: 35 },
    mid: { position: [-12, 38, 56], target: [-6, 0, 3], fov: 37 },
    end: { position: [-4, 22, 18], target: [0, 0, 0], fov: 40 },
  },
  // Studio, three-quarter: the crane against sand, the ship's bay and the spreader seating on the APG box.
  crane: {
    start: { position: [70, 35, 95], target: [-12, 24, -5], fov: 32 },
    mid: { position: [62, 30, 105], target: [-14, 22, -4], fov: 32 },
    end: { position: [52, 26, 112], target: [-16, 20, -2], fov: 32 },
  },
  // Turning to the truck's profile as the box crosses and lands on the trailer.
  load: {
    start: { position: [48, 16, 48], target: [-8, 12, 0], fov: 34 },
    mid: { position: [44, 11, 28], target: [-6, 8, 0], fov: 34 },
    end: { position: [36, 5.5, 4], target: [-5, 2.5, 0], fov: 32 },
  },
  // The truck in profile on the dark road, the camera travelling alongside at cab height.
  highway: {
    start: { position: [-4, 3.4, -15], target: [0, 2, 6.9], fov: 34 },
    mid: { position: [2, 3.2, -14.5], target: [2.5, 2, 6.9], fov: 34 },
    end: { position: [8, 3, -14], target: [5, 2, 6.9], fov: 34 },
  },
  // From above: the CONE terminal as a plan.
  terminal: {
    start: { position: [20, 150, 70], target: [0, 0, -8], fov: 34 },
    mid: { position: [10, 140, 50], target: [0, 0, -10], fov: 34 },
    end: { position: [0, 130, 30], target: [0, 0, -12], fov: 34 },
  },
  // From above, zooming out from Suape to the whole of PE and BA.
  distribution: {
    start: { position: [-6, 45, 22], target: [-2, 0, 2], fov: 34 },
    mid: { position: [-40, 120, 75], target: [-38, 0, 40], fov: 34 },
    end: { position: [-70, 210, 110], target: [-70, 0, 54], fov: 34 },
  },
};
