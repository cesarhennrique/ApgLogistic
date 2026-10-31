import { describe, expect, it } from "vitest";
import { site } from "./site";

describe("site content", () => {
  it("gives every service a unique slug", () => {
    const slugs = site.services.map((s) => s.slug);
    expect(slugs).toEqual([
      "containers-suape",
      "operacao-bahia",
      "logistica-armazenagem",
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("gives every service exactly 4 FAQs", () => {
    for (const service of site.services) {
      expect(service.faq, service.slug).toHaveLength(4);
    }
  });
});
