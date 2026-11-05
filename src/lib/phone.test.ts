import { describe, expect, it } from "vitest";
import { maskPhone } from "./phone";

describe("maskPhone", () => {
  it("masks a landline and a mobile as they are typed", () => {
    expect(maskPhone("")).toBe("");
    expect(maskPhone("8")).toBe("(8");
    expect(maskPhone("81")).toBe("(81");
    expect(maskPhone("813")).toBe("(81) 3");
    expect(maskPhone("813202")).toBe("(81) 3202");
    expect(maskPhone("8132021800")).toBe("(81) 3202-1800");
    expect(maskPhone("81932021800")).toBe("(81) 93202-1800");
  });

  it("keeps only digits, at most 11 (a pasted +55 is dropped)", () => {
    expect(maskPhone("(81) 3202-1800")).toBe("(81) 3202-1800");
    expect(maskPhone("+55 81 93202-1800")).toBe("(81) 93202-1800");
    expect(maskPhone("819320218001234")).toBe("(81) 93202-1800");
  });
});
