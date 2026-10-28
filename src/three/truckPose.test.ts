import { describe, expect, it } from "vitest";
import { TRAILER_BED_HEIGHT, TRUCK_LOAD_POINT } from "./anchors";
import { HIGHWAY } from "./models/highwayLayout";
import { LEAVE, truckPoseAt } from "./truckPose";

describe("truckPoseAt", () => {
  it("waits in the crane's lane, cab toward the quay's end (-Z), until the box is on and the spreader is up", () => {
    for (const p of [0, 0.2, 0.4, LEAVE[0]]) {
      const pose = truckPoseAt(p, 5, false);
      expect(pose.position.distanceTo(TRUCK_LOAD_POINT)).toBeLessThan(1e-6);
      expect(pose.yaw).toBeCloseTo(Math.PI, 6);
      expect(pose.onHighway).toBe(false);
      expect(pose.speed).toBe(0);
    }
    expect(LEAVE[0]).toBeGreaterThan(0.4);
  });

  it("drives down the lane, turns right onto the BR-101 and arrives at its standing point, without jumping", () => {
    const last = truckPoseAt(LEAVE[0], 0, false);
    let lastPos = last.position.clone();
    let lastYaw = last.yaw;
    for (let p = LEAVE[0]; p <= LEAVE[1]; p += 0.001) {
      const pose = truckPoseAt(p, 0, false);
      // A truck at speed: up to 2.5 m per 0.001 of progress (a few pixels of scroll), but never a jump.
      expect(pose.position.distanceTo(lastPos)).toBeLessThan(2.5);
      // Heading turns no faster than the 33 m-radius curve at that speed (2.5 m / 33 m ≈ 0.076 rad).
      expect(Math.abs(pose.yaw - lastYaw)).toBeLessThan(0.08);
      lastPos = pose.position.clone();
      lastYaw = pose.yaw;
    }
    const end = truckPoseAt(LEAVE[1], 0, false);
    expect(end.position.x).toBeCloseTo(HIGHWAY.x, 3);
    expect(end.position.z).toBeCloseTo(HIGHWAY.truckLaneZ, 3);
    expect(end.yaw).toBeCloseTo(Math.PI / 2, 3);
  });

  it("is on the highway from the end of the drive: right-hand lane, heading +X, wheels on the road", () => {
    expect(LEAVE[1]).toBe(0.52);
    const pose = truckPoseAt(0.55, 3, false);
    expect(pose.onHighway).toBe(true);
    expect(pose.position.x).toBeCloseTo(HIGHWAY.x, 6);
    expect(pose.position.z).toBeCloseTo(HIGHWAY.truckLaneZ, 6);
    expect(pose.position.y).toBeCloseTo(HIGHWAY.roadY + TRAILER_BED_HEIGHT, 6);
    expect(pose.yaw).toBeCloseTo(Math.PI / 2, 6);
  });

  it("cruises on time: the road scrolls by its speed, and stands still with reduced motion", () => {
    expect(truckPoseAt(0.55, 2, false).scroll).toBeGreaterThan(truckPoseAt(0.55, 1, false).scroll);
    expect(truckPoseAt(0.55, 1, false).speed).toBeGreaterThan(15);
    expect(truckPoseAt(0.55, 9, true).scroll).toBe(0);
  });
});
