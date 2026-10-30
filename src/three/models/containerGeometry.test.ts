import { Box3 } from "three";
import { describe, expect, it } from "vitest";
import { edgeSegments } from "../blueprint/edges";
import { CONTAINER, getContainerBox, getStripeBand } from "./containerGeometry";

const bounds = (g: Parameters<Box3["setFromBufferAttribute"]>[0]) => new Box3().setFromBufferAttribute(g);

describe("container geometry", () => {
  it("builds 20' and 40' boxes at ISO 668 sizes: length on Z, width on X, height on Y", () => {
    for (const type of ["20", "40"] as const) {
      const box = bounds(getContainerBox(type).getAttribute("position") as never);
      const { length, width, height } = CONTAINER[type];
      expect(box.max.z - box.min.z).toBeCloseTo(length);
      expect(box.max.x - box.min.x).toBeCloseTo(width);
      expect(box.max.y - box.min.y).toBeCloseTo(height);
    }
    expect(CONTAINER["40"].length / CONTAINER["20"].length).toBeCloseTo(2.01, 2);
  });

  it("puts the origin at the bottom center, so an instance's position is where it rests", () => {
    const box = bounds(getContainerBox("40").getAttribute("position") as never);
    expect(box.min.y).toBeCloseTo(0);
    expect(box.min.x + box.max.x).toBeCloseTo(0);
    expect(box.min.z + box.max.z).toBeCloseTo(0);
  });

  it("returns one memoized geometry per type", () => {
    expect(getContainerBox("20")).toBe(getContainerBox("20"));
    expect(getStripeBand("40")).toBe(getStripeBand("40"));
  });

  it("draws as a clean box: 12 edges, no triangle diagonals", () => {
    expect(edgeSegments(getContainerBox("40")).length / 6).toBe(12);
  });

  it("wraps the APG band around all four sides, just proud of the box, at 58–70% of its height", () => {
    const band = bounds(getStripeBand("40").getAttribute("position") as never);
    const { length, width, height } = CONTAINER["40"];
    expect(band.max.x).toBeGreaterThan(width / 2);
    expect(band.max.z).toBeGreaterThan(length / 2);
    expect(band.min.y).toBeCloseTo(height * 0.58);
    expect(band.max.y).toBeCloseTo(height * 0.7);
  });
});
