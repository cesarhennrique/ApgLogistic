"use client";

import { useEffect } from "react";
import { JOURNEY_MOUNTED } from "@/lib/phoneLayout";
import { CraneLift } from "./CraneLift";
import { Distribution } from "./Distribution";
import { Estrada } from "./Estrada";
import { JourneyIndex } from "./JourneyIndex";
import { Load } from "./Load";
import { OceanArrival } from "./OceanArrival";

// The desktop journey's scenes 1–5 (spec §3), each a section with its own sticky stage, and the side index.
export default function DesktopScenes() {
  // (after the scenes' own effects: their triggers made)
  useEffect(() => void window.dispatchEvent(new Event(JOURNEY_MOUNTED)), []);
  return (
    <>
      <OceanArrival />
      <CraneLift />
      <Load />
      <Estrada />
      <Distribution />
      <JourneyIndex />
    </>
  );
}
