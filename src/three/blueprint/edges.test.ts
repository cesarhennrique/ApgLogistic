import { BoxGeometry, Matrix4 } from "three";
import { describe, expect, it } from "vitest";
import { cumulativeLengths, edgeSegments, instanceSegments } from "./edges";

describe("blueprint edges", () => {
  it("accumulates each segment's start and end distance along the drawing order", () => {
    // Three segments: 3 m, 4 m (not touching the first), 5 m.
    const positions = new Float32Array([0, 0, 0, 3, 0, 0, 10, 0, 0, 10, 4, 0, 0, 0, 0, 3, 4, 0]);
    expect([...cumulativeLengths(positions)]).toEqual([0, 3, 3, 7, 7, 12]);
  });

  it("keeps a box's 12 edges only (no triangle diagonals), drawn from the bottom up", () => {
    const segments = edgeSegments(new BoxGeometry(2, 2, 2));
    expect(segments.length / 6).toBe(12);
    const lowest = (i: number) => Math.min(segments[i * 6 + 1], segments[i * 6 + 4]);
    for (let i = 1; i < 12; i++) expect(lowest(i)).toBeGreaterThanOrEqual(lowest(i - 1));
  });

  it("repeats the edges per instance, moved by its matrix", () => {
    const base = edgeSegments(new BoxGeometry(1, 1, 1));
    const both = instanceSegments(base, [new Matrix4(), new Matrix4().makeTranslation(10, 0, 0)]);
    expect(both.length).toBe(base.length * 2);
    const xs = [];
    for (let i = 0; i < both.length; i += 3) xs.push(both[i]);
    expect(Math.max(...xs)).toBeCloseTo(10.5);
  });
});
