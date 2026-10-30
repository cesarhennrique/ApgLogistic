"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { introBridge } from "@/components/intro/bridge";
import type { Group } from "three";
import type { ChapterId } from "../chapters";
import { journeyProgress } from "../progress";
import { STAGES } from "./index";
import { STAGE_IDS, activeStages } from "./timeline";

// Renders only the current stage and, in a transition, the next one. Visibility is flipped on the groups every
// frame; React re-renders only when the set changes (a handful of times per scroll). Only the stages on screen are created at first; the rest wait
// until the hero map has rendered and the main thread is idle, so the first stage's assets load alone.
export function Stages({ reducedMotion }: { reducedMotion: boolean }) {
  const groups = useRef<Partial<Record<ChapterId, Group | null>>>({});
  const [active, setActive] = useState(() => activeStages(journeyProgress.value).join(","));
  const [all, setAll] = useState(false);
  const scheduled = useRef(false);

  useFrame(() => {
    // No hero on screen (a reload mid-journey, ?p): nothing to wait for.
    if (!scheduled.current && (introBridge.frame || !active.split(",").includes("hero"))) {
      scheduled.current = true;
      const later = () => setAll(true);
      if ("requestIdleCallback" in window) requestIdleCallback(later, { timeout: 3000 });
      else setTimeout(later, 1500);
    }
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
        if (!on && !all) return null;
        return (
          <group
            key={id}
            position={origin}
            visible={on}
            ref={(g) => {
              groups.current[id] = g;
            }}
          >
            <Stage reducedMotion={reducedMotion} />
          </group>
        );
      })}
    </>
  );
}
