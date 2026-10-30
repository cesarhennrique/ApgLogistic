"use client";

import { Grid } from "../blueprint/Grid";
import { Terminal } from "../scene/Terminal";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.terminal;

// Chapter 4 (sand, from above): the CONE terminal as a plan. shortcut: Prompt 10's yard in line work; Prompt 13c
// makes it the plan view.
export function TerminalStage() {
  return (
    <>
      <Terminal />
      <Grid y={-0.15} />
    </>
  );
}
