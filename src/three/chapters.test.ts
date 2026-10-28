import { describe, expect, it } from "vitest";
import { CHAPTERS, localProgress, trackChapterAt } from "./chapters";

describe("CHAPTERS", () => {
  it("follows the journey order with the global ranges", () => {
    expect(CHAPTERS.map((c) => [c.id, c.start, c.end])).toEqual([
      ["hero", 0, 0],
      ["crane", 0, 0.2],
      ["load", 0.2, 0.4],
      ["highway", 0.4, 0.6],
      ["terminal", 0.6, 0.8],
      ["distribution", 0.8, 1],
    ]);
  });
});

describe("localProgress", () => {
  it("is 0 everywhere at global 0", () => {
    for (const c of CHAPTERS) expect(localProgress(0, c.id)).toBe(0);
  });

  it("completes a chapter exactly on its end boundary", () => {
    expect(localProgress(0.2, "crane")).toBe(1);
    expect(localProgress(0.2, "load")).toBe(0);
  });

  it("stays just short of the boundary at 0.1999", () => {
    expect(localProgress(0.1999, "crane")).toBeCloseTo(0.9995, 6);
    expect(localProgress(0.1999, "load")).toBe(0);
  });

  it("is 1 everywhere at global 1", () => {
    for (const c of CHAPTERS) expect(localProgress(1, c.id)).toBe(1);
  });

  it("clamps negative and overshooting values", () => {
    for (const c of CHAPTERS) {
      expect(localProgress(-0.5, c.id)).toBe(0);
      expect(localProgress(1.5, c.id)).toBe(1);
    }
  });

  it("treats the hero as done once the track starts", () => {
    expect(localProgress(0.0001, "hero")).toBe(1);
    expect(localProgress(0.5, "hero")).toBe(1);
  });

  it("maps the middle of a chapter to 0.5", () => {
    expect(localProgress(0.5, "highway")).toBeCloseTo(0.5, 10);
  });
});

describe("trackChapterAt", () => {
  it("picks the track chapter for a global progress, never the hero", () => {
    expect(trackChapterAt(-1)).toBe("crane");
    expect(trackChapterAt(0)).toBe("crane");
    expect(trackChapterAt(0.1999)).toBe("crane");
    expect(trackChapterAt(0.2)).toBe("load");
    expect(trackChapterAt(0.79)).toBe("terminal");
    expect(trackChapterAt(1)).toBe("distribution");
  });
});
