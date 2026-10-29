"use client";

import { ContactShadows } from "@react-three/drei";
import { Terminal } from "../scene/Terminal";
import { STAGE_CAMERAS } from "./cameras";

export const keys = STAGE_CAMERAS.terminal;

// Chapter 4 (sand, from above): the CONE terminal as a plan. shortcut: Prompt 10's yard; Prompt 13c stylizes it.
export function TerminalStage({ active }: { active: boolean }) {
  return (
    <>
      <Terminal />
      {active && (
        <ContactShadows position={[0, 0.03, -11]} scale={140} resolution={512} far={30} blur={2.5} opacity={0.4} color="#1a1d26" />
      )}
    </>
  );
}
