import { describe, expect, it } from "vitest";
import { capSizes } from "./sizes";

describe("capSizes", () => {
  it("leaves the sizes alone when the screen is at most 2×", () => {
    expect(capSizes("(min-width: 768px) 90vw, 250vw", 1)).toBe("(min-width: 768px) 90vw, 250vw");
    expect(capSizes("(min-width: 768px) 90vw, 250vw", 2)).toBe("(min-width: 768px) 90vw, 250vw");
  });

  it("scales every size by 2/dpr past 2×, so the browser picks as if at 2×", () => {
    expect(capSizes("(min-width: 768px) 90vw, 250vw", 3)).toBe("(min-width: 768px) calc(90vw * 0.6667), calc(250vw * 0.6667)");
    expect(capSizes("(min-aspect-ratio: 6688/3764) 100vw, 177.7vh", 3)).toBe(
      "(min-aspect-ratio: 6688/3764) calc(100vw * 0.6667), calc(177.7vh * 0.6667)",
    );
    expect(capSizes("100vw", 4)).toBe("calc(100vw * 0.5)");
  });
});
