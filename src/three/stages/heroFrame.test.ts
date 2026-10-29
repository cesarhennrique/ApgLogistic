import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { HERO_BOUNDS } from "../models/heroMapLayout";
import { fitHeroFrame, heroFitPoints } from "./heroFrame";

// The fitted shot's projected bounds (with its view offset), in px, at a given orbit angle.
function projectedRect(width: number, height: number, frame: ReturnType<typeof fitHeroFrame>, orbit = 0) {
  const camera = new PerspectiveCamera(frame.fov, width / height, 0.5, 2500);
  const offset = frame.position.clone().sub(frame.target).applyAxisAngle(new Vector3(0, 1, 0), (orbit * Math.PI) / 180);
  camera.position.copy(frame.target).add(offset);
  camera.lookAt(frame.target);
  camera.setViewOffset(width, height, frame.offsetX, frame.offsetY, width, height);
  camera.updateMatrixWorld();
  const rect = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
  for (const p of heroFitPoints) {
    const v = p.clone().project(camera);
    const x = ((v.x + 1) / 2) * width;
    const y = ((1 - v.y) / 2) * height;
    rect.left = Math.min(rect.left, x);
    rect.right = Math.max(rect.right, x);
    rect.top = Math.min(rect.top, y);
    rect.bottom = Math.max(rect.bottom, y);
  }
  return rect;
}

const DIRECTION = new Vector3(0, Math.sin((35 * Math.PI) / 180), Math.cos((35 * Math.PI) / 180));

describe("fitHeroFrame", () => {
  const cases = [
    { name: "desktop 1440×900, beside the copy", width: 1440, height: 900, region: { left: 860, right: 1390, top: 96, bottom: 830 } },
    { name: "desktop 1920×1080", width: 1920, height: 1080, region: { left: 1000, right: 1860, top: 96, bottom: 1010 } },
    { name: "mobile 390×664, above the copy", width: 390, height: 664, region: { left: 16, right: 374, top: 72, bottom: 300 } },
  ];

  for (const { name, width, height, region } of cases) {
    it(`keeps the map inside the free region, orbit included: ${name}`, () => {
      const frame = fitHeroFrame({ width, height, region, direction: DIRECTION, fov: 35 });
      for (const orbit of [-7, 0, 7]) {
        const rect = projectedRect(width, height, frame, orbit);
        expect(rect.left).toBeGreaterThanOrEqual(region.left - 0.5);
        expect(rect.right).toBeLessThanOrEqual(region.right + 0.5);
        expect(rect.top).toBeGreaterThanOrEqual(region.top - 0.5);
        expect(rect.bottom).toBeLessThanOrEqual(region.bottom + 0.5);
      }
      // And fills it along one axis: as large as the region allows.
      const rect = projectedRect(width, height, frame);
      const fill = Math.max((rect.right - rect.left) / (region.right - region.left), (rect.bottom - rect.top) / (region.bottom - region.top));
      expect(fill).toBeGreaterThan(0.85);
    });
  }

  it("aims at the middle of the map", () => {
    const frame = fitHeroFrame({ width: 1440, height: 900, region: { left: 860, right: 1390, top: 96, bottom: 830 }, direction: DIRECTION, fov: 35 });
    expect(frame.target.distanceTo(HERO_BOUNDS.getCenter(new Vector3()))).toBeLessThan(1e-6);
  });
});
