import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom has no matchMedia; gsap's ScrollTrigger calls it on import. Tests stub it to change `matches`.
// (not in the node environment: route tests)
if (typeof window !== "undefined")
  window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as unknown as MediaQueryList;
