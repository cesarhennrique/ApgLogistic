"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { Group } from "three";
import type { ChapterId } from "../chapters";
import { journeyProgress } from "../progress";
import { STAGES } from "./index";
import { STAGE_IDS, activeStages } from "./timeline";

// Renders only the current stage and, in a transition, the next one. Visibility is flipped on the groups every
// frame; React re-renders only when the set changes (a handful of times per scroll), to mount each stage's
// contact shadows only while it is on screen.
export function Stages({ reducedMotion }: { reducedMotion: boolean }) {
  const groups = useRef<Partial<Record<ChapterId, Group | null>>>({});
  const [active, setActive] = useState(() => activeStages(journeyProgress.value).join(","));

  useFrame(() => {
    const ids = activeStages(journeyProgress.value);
    for (const id of STAGE_IDS) {
      const g = groups.current[id];
      if (g) g.visible = ids.includes(id);
    }
    const key = ids.join(",");
    if (key !== active) setActive(key);
  });

  return (
    <>
      {STAGE_IDS.map((id) => {
        const { Stage, origin } = STAGES[id];
        const on = active.split(",").includes(id);
        return (
          <group
            key={id}
            position={origin}
            visible={on}
            ref={(g) => {
              groups.current[id] = g;
            }}
          >
            <Stage reducedMotion={reducedMotion} active={on} />
          </group>
        );
      })}
    </>
  );
}
