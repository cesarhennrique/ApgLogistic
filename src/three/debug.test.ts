import { describe, expect, it } from "vitest";
import { readDebugParams } from "./debug";

describe("readDebugParams", () => {
  it("is all off without params", () => {
    expect(readDebugParams("")).toEqual({ frozen: null, debug: false });
  });

  it("freezes on ?p and clamps it to 0–1", () => {
    expect(readDebugParams("?p=0.35").frozen).toBe(0.35);
    expect(readDebugParams("?p=-2").frozen).toBe(0);
    expect(readDebugParams("?p=7").frozen).toBe(1);
  });

  it("ignores a ?p that is not a number", () => {
    expect(readDebugParams("?p=abc").frozen).toBeNull();
    expect(readDebugParams("?p=").frozen).toBeNull();
  });

  it("turns debug on with a bare ?debug", () => {
    expect(readDebugParams("?debug").debug).toBe(true);
    expect(readDebugParams("?p=0.5&debug").debug).toBe(true);
  });
});
