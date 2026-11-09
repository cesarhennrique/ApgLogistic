import { describe, expect, it } from "vitest";
import { pickLoaded } from "./videoSlots";

const VH = 800;
// a clip a screen and a bit tall, its top at `top`
const at = (top: number) => ({ top, bottom: top + 900 });

describe("pickLoaded", () => {
  it("loads the clips within a screen of the viewport", () => {
    expect(pickLoaded([at(-3000), at(700), at(5000)], VH)).toEqual([1]);
    // its bottom a screen above the top: still near; past that, not
    expect(pickLoaded([at(-1700), at(-1701)], VH)).toEqual([0]);
    // its top a screen below the bottom: still near
    expect(pickLoaded([at(1600), at(1601)], VH)).toEqual([0]);
  });

  it("keeps at most two, the nearest", () => {
    // on screen, just below, just above
    expect(pickLoaded([at(-1000), at(-100), at(850)], VH)).toEqual([1, 2]);
    expect(pickLoaded([at(-950), at(-100), at(1500)], VH)).toEqual([1, 0]);
  });

  it("honours another limit", () => {
    expect(pickLoaded([at(0), at(900)], VH, 1)).toEqual([0]);
  });
});
