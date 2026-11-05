import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter (sliding window)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("allows `limit` hits in the window, then refuses", () => {
    const allow = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });
    for (let i = 0; i < 5; i++) expect(allow("1.2.3.4")).toBe(true);
    expect(allow("1.2.3.4")).toBe(false);
  });

  it("counts each key on its own", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(allow("a")).toBe(true);
    expect(allow("b")).toBe(true);
    expect(allow("a")).toBe(false);
  });

  it("slides: a hit leaves the window windowMs after it was made", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(allow("a")).toBe(true); // t = 0
    vi.advanceTimersByTime(30_000);
    expect(allow("a")).toBe(true); // t = 30 s
    expect(allow("a")).toBe(false);
    vi.advanceTimersByTime(30_000); // t = 60 s: the first one is out
    expect(allow("a")).toBe(true);
    expect(allow("a")).toBe(false);
    vi.advanceTimersByTime(29_999); // the 30 s one still in
    expect(allow("a")).toBe(false);
  });

  it("a refused hit does not count", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(allow("a")).toBe(true);
    vi.advanceTimersByTime(59_000);
    expect(allow("a")).toBe(false);
    vi.advanceTimersByTime(1_000);
    expect(allow("a")).toBe(true);
  });
});
