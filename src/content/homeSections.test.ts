import { describe, expect, it } from "vitest";
import { HOME_SECTIONS, homeCodes } from "./homeSections";

const numbers = (codes: Partial<Record<string, number>>) => Object.values(codes).sort((a, b) => a! - b!);

describe("home section codes", () => {
  it("numbers every section 01–10 in order, with Clients", () => {
    const codes = homeCodes([]);
    expect(numbers(codes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(HOME_SECTIONS.map((s) => codes[s])).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(codes.hero).toBe(1);
    expect(codes.chegada).toBe(2);
    expect(codes.estrada).toBe(5);
    expect(codes.distribuicao).toBe(6);
    expect(codes.services).toBe(7);
    expect(codes.finalCta).toBe(10);
  });

  it("skips a hidden section without a gap: without Clients, the CTA is 09", () => {
    const codes = homeCodes(["clients"]);
    expect(codes.clients).toBeUndefined();
    expect(numbers(codes)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(codes.finalCta).toBe(9);
  });
});
