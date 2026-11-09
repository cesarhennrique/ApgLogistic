"use client";

import dynamic from "next/dynamic";
import { usePhoneLayout } from "@/lib/phoneLayout";

// Until the layout is known (and while its chunk loads): the scenes' height held (no jump of what follows), in the
// journey's navy. Desktop: the five scenes' scroll less their slides' overlaps (220 + 360 + 220 + 1170 + 360 vh).
function Placeholder() {
  return <div aria-hidden="true" className="h-[2330vh] bg-navy-900 phone:h-[1500vw]" />;
}

const DesktopScenes = dynamic(() => import("@/components/journey/DesktopScenes"), { ssr: false, loading: Placeholder });
const MobileJourney = dynamic(() => import("@/components/journey/mobile/MobileJourney"), { ssr: false, loading: Placeholder });

// Scenes 1–5 (spec §3): on a wide screen with a fine pointer the pinned, scrubbed scenes; anything else the phone's
// (lib/phoneLayout). Decided once, in the browser, before either mounts: only the chosen one's code (and images) load.
export function JourneyScenes() {
  const phone = usePhoneLayout();
  if (phone === null) return <Placeholder />;
  return phone ? <MobileJourney /> : <DesktopScenes />;
}
