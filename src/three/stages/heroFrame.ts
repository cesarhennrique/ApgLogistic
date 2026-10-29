import { PerspectiveCamera, Vector3 } from "three";
import { HERO_BOUNDS, HERO_HULL, HERO_ROUTES } from "../models/heroMapLayout";

export type Rect = { left: number; right: number; top: number; bottom: number };

// What must stay in the frame: the map's hull and the routes' arcs.
export const heroFitPoints = [...HERO_HULL, ...HERO_ROUTES.flatMap((r) => r.getPoints(8))];

// The orbit (±6°) swings the shot, the pointer parallax (±2° of tilt) a little more; the fit holds at either
// extreme.
const SWING = (7 * Math.PI) / 180;
const Y = new Vector3(0, 1, 0);

const camera = new PerspectiveCamera();
const point = new Vector3();
const offset = new Vector3();

function project(width: number, height: number, target: Vector3, position: Vector3): Rect {
  const rect = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const angle of [-SWING, 0, SWING]) {
    offset.subVectors(position, target).applyAxisAngle(Y, angle);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    for (const p of heroFitPoints) {
      point.copy(p).project(camera);
      const x = ((point.x + 1) / 2) * width;
      const y = ((1 - point.y) / 2) * height;
      rect.left = Math.min(rect.left, x);
      rect.right = Math.max(rect.right, x);
      rect.top = Math.min(rect.top, y);
      rect.bottom = Math.max(rect.bottom, y);
    }
  }
  return rect;
}

// The hero's opening shot for a viewport: from `direction` (unit, target to camera), as close as the free
// `region` (px, the screen minus the copy and the bars) allows, then lens-shifted (a view offset, so the
// perspective stays centered on the map) until the map sits in the middle of that region.
export function fitHeroFrame({
  width,
  height,
  region,
  direction,
  fov,
}: {
  width: number;
  height: number;
  region: Rect;
  direction: Vector3;
  fov: number;
}) {
  camera.fov = fov;
  camera.aspect = width / height;
  camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const target = HERO_BOUNDS.getCenter(new Vector3());
  const position = new Vector3();
  let distance = 150;
  let rect: Rect = region;
  // Projected size goes roughly as 1 / distance: a few rounds settle it.
  for (let i = 0; i < 6; i++) {
    position.copy(direction).multiplyScalar(distance).add(target);
    rect = project(width, height, target, position);
    distance *= Math.max((rect.right - rect.left) / (region.right - region.left), (rect.bottom - rect.top) / (region.bottom - region.top));
  }
  position.copy(direction).multiplyScalar(distance).add(target);
  rect = project(width, height, target, position);
  return {
    target,
    position,
    fov,
    offsetX: (rect.left + rect.right) / 2 - (region.left + region.right) / 2,
    offsetY: (rect.top + rect.bottom) / 2 - (region.top + region.bottom) / 2,
  };
}
