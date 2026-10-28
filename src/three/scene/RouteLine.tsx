"use client";

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import { journeyProgress } from "../progress";
import { ROUTE_CURVE, ROUTE_LENGTH, revealAt } from "../routePath";
import { withSkyFog } from "./skyShared";

const POINTS = ROUTE_CURVE.getSpacedPoints(720);

// The signature: one red line (red-500) on the ground from the crane's lane to the map, drawn as the journey
// goes. Line2 at a constant width on screen. The reveal is a single dash: with dash and gap both the line's
// length, an offset of (length - drawn) shows exactly the first `drawn` meters.
// Bloom on the high tier comes with Prompt 15's post-processing.
export function RouteLine() {
  const line = useRef<Line2>(null);

  // Same fog as the scene, before the first compile.
  useLayoutEffect(() => {
    withSkyFog(line.current!.material);
  }, []);

  useFrame(() => {
    line.current!.material.dashOffset = ROUTE_LENGTH - revealAt(journeyProgress.value);
  });

  return (
    <Line
      ref={line}
      points={POINTS}
      color="#e31e24"
      lineWidth={4}
      dashed
      dashSize={ROUTE_LENGTH}
      gapSize={ROUTE_LENGTH}
      dashOffset={ROUTE_LENGTH}
      frustumCulled={false}
    />
  );
}
