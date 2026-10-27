import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { CtaButton } from "./CtaButton";

it("renders a link to href", () => {
  render(<CtaButton href="/contato">Solicitar cotação</CtaButton>);
  const link = screen.getByRole("link", { name: "Solicitar cotação" });
  expect(link.getAttribute("href")).toBe("/contato");
});
