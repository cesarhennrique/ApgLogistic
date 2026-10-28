import { describe, expect, it } from "vitest";
import { shouldRebake } from "./envBake";

describe("shouldRebake", () => {
  it("bakes when nothing has been baked yet", () => {
    expect(shouldRebake({ progress: 0.3, bakedAt: null, stillFor: 0 })).toBe(true);
  });

  it("waits while the scroll is moving, however far it went", () => {
    expect(shouldRebake({ progress: 0.9, bakedAt: 0.1, stillFor: 0.19 })).toBe(false);
  });

  it("rebakes once the scroll rests 200 ms and the progress moved 0.05 or more", () => {
    expect(shouldRebake({ progress: 0.35, bakedAt: 0.3, stillFor: 0.2 })).toBe(true);
    expect(shouldRebake({ progress: 0.25, bakedAt: 0.3, stillFor: 0.5 })).toBe(true);
  });

  it("skips small moves even at rest", () => {
    expect(shouldRebake({ progress: 0.349, bakedAt: 0.3, stillFor: 5 })).toBe(false);
  });
});
