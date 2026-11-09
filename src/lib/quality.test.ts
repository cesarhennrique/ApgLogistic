import { describe, expect, it } from "vitest";
import { pickTier } from "./quality";

const base = { webgl: true, reducedMotion: false, saveData: false, lowMemory: false, phone: false };

describe("pickTier", () => {
  it("is 'high' on a capable device", () => {
    expect(pickTier(base)).toBe("high");
  });

  it("is 'static' without WebGL or with reduced motion, whatever else", () => {
    expect(pickTier({ ...base, webgl: false })).toBe("static");
    expect(pickTier({ ...base, reducedMotion: true })).toBe("static");
    expect(pickTier({ webgl: false, reducedMotion: true, saveData: true, lowMemory: true, phone: true })).toBe("static");
    expect(pickTier({ ...base, webgl: false, phone: true })).toBe("static");
    expect(pickTier({ ...base, webgl: false, saveData: true })).toBe("static");
    expect(pickTier({ ...base, reducedMotion: true, lowMemory: true })).toBe("static");
  });

  it("is 'low' with data saving or little memory", () => {
    expect(pickTier({ ...base, saveData: true })).toBe("low");
    expect(pickTier({ ...base, lowMemory: true })).toBe("low");
    expect(pickTier({ ...base, saveData: true, lowMemory: true })).toBe("low");
  });

  it("is 'low' on a phone (touch first, or iOS): its memory is the tightest", () => {
    expect(pickTier({ ...base, phone: true })).toBe("low");
  });
});
