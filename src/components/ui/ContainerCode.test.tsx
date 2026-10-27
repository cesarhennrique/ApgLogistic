import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ContainerCode } from "./ContainerCode";

it("formats the ISO 6346-style code with an uppercased label", () => {
  render(<ContainerCode index={2} label="Serviços" />);
  expect(screen.getByText("APGU 1996-02 · SERVIÇOS")).toBeTruthy();
});
