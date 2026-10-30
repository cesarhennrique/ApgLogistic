"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group, Vector3 } from "three";
import type { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { inView } from "../stages/inView";
import { buildEdges, type Reveal, readReveal } from "./BlueprintMesh";
import { dimensionSegments, type Vec3 } from "./dimension";
import { ink } from "./ink";

type Props = { from: Vec3; to: Vec3; label: string; offset: Vec3; reveal?: Reveal };

// The label: plain DOM over the canvas (inside the aria-hidden stage layer), placed each frame by projecting the
// dimension's middle, so the mono text keeps its size in px at any distance.
const LABEL_CLASS =
  "pointer-events-none absolute top-0 left-0 font-mono text-[11px] tracking-[0.14em] whitespace-nowrap tabular-nums";

const point = new Vector3();

// A technical dimension (cota): extension lines, the dimension line with 45° ticks, and its value in mono. It
// draws on with `reveal` (line work over the first 70%, then the label).
export function Dimension({ from, to, label, offset, reveal }: Props) {
  const group = useRef<Group>(null);
  const lines = useRef<LineSegments2>(null);
  const text = useRef<HTMLDivElement | null>(null);
  const getState = useThree((s) => s.get);
  const key = [...from, ...to, ...offset].join(",");
  const line = useMemo(() => buildEdges(dimensionSegments(from, to, offset), "primary"), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // Where the label sits: the middle of the dimension line, a little further out.
  const anchor = useMemo(() => {
    const out = new Vector3(...offset);
    return new Vector3(...from).add(new Vector3(...to)).multiplyScalar(0.5).add(out).addScaledVector(out.clone().normalize(), 1.6);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = document.createElement("div");
    el.className = LABEL_CLASS;
    el.textContent = label;
    el.style.opacity = "0";
    getState().gl.domElement.parentElement!.appendChild(el);
    text.current = el;
    return () => {
      el.remove();
      text.current = null;
    };
  }, [label, getState]);

  useFrame(({ camera, size }) => {
    const f = readReveal(reveal);
    const drawn = Math.min(f / 0.7, 1);
    const l = lines.current!;
    l.visible = drawn > 0;
    l.material.dashOffset = l.userData.total * (1 - drawn);
    const el = text.current;
    if (!el) return;
    const opacity = inView(group.current!) ? Math.max((f - 0.7) / 0.3, 0) : 0;
    el.style.opacity = String(opacity);
    if (opacity === 0) return;
    el.style.color = ink.stroke.value.getStyle();
    point.copy(anchor).applyMatrix4(group.current!.matrixWorld).project(camera);
    const x = ((point.x + 1) / 2) * size.width;
    const y = ((1 - point.y) / 2) * size.height;
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
  });

  return (
    <group ref={group}>
      <primitive ref={lines} object={line} />
    </group>
  );
}
