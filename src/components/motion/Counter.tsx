"use client";

import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

type Props = { value: number; suffix?: string; duration?: number };

const format = new Intl.NumberFormat("pt-BR").format;

export function Counter({ value, suffix, duration = 1.6 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const final = format(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    const state = { n: 0 };
    el.textContent = format(0);
    const tween = gsap.to(state, {
      n: value,
      duration,
      ease: "power2.out",
      // writes the DOM directly: no React re-render per frame
      onUpdate: () => (el.textContent = format(Math.round(state.n))),
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      el.textContent = final;
    };
  }, [value, duration, reducedMotion, final]);

  return (
    <span className="font-mono-tabular whitespace-nowrap">
      <span className="sr-only">
        {final}
        {suffix}
      </span>
      {/* width fixed to the final string: mono + tabular digits means no layout shift while counting */}
      <span aria-hidden="true">
        <span ref={ref} className="inline-block text-end" style={{ width: `${final.length}ch` }}>
          {final}
        </span>
        {suffix}
      </span>
    </span>
  );
}
