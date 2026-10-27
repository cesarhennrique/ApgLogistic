import { render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Counter } from "./Counter";

afterEach(() => vi.unstubAllGlobals());

it("shows the final value straight away when reduced motion is on", () => {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
  const { container } = render(<Counter value={35000} suffix=" m²" />);
  expect(container.textContent).toContain("35.000");
  expect(container.textContent).not.toMatch(/(^|\D)0( |$)/);
});
