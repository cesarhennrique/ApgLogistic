"use client";

import { useProgress } from "@react-three/drei";
import { useEffect } from "react";
import { introBridge } from "@/components/intro/bridge";

type Progress = { progress: number; active: boolean; total: number };

// Feeds drei's loading progress to the first-visit loader. Latched at 1 once everything queued so far is in:
// the stages loaded later (Stages, after idle) must not pull the counter back. Subscribed to the store directly,
// not through the hook: loads start inside other components' renders, and a re-render here would be a setState
// during their render.
export function LoadProbe() {
  useEffect(() => {
    const read = ({ progress, active, total }: Progress) => {
      if (introBridge.assets >= 1) return;
      introBridge.assets = !active && total > 0 ? 1 : Math.max(introBridge.assets, progress / 100);
    };
    read(useProgress.getState());
    return useProgress.subscribe(read);
  }, []);
  return null;
}
