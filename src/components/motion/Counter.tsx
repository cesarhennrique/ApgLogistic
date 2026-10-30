"use client";

import { useEffect, useRef } from "react";
import { gsap, type ScrollTrigger } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

type Props = {
  value: number;
  suffix?: string;
  duration?: number;
  // When to start counting (a ScrollTrigger start). By default as the number scrolls into view; inside a sticky
  // stage the number never scrolls, so the scene passes the scroll position where its copy appears.
  start?: ScrollTrigger.Vars["start"];
  // The number's face: mono by default (stats); a headline passes its own.
  className?: string;
};

const format = new Intl.NumberFormat("pt-BR").format;

export function Counter({ value, suffix, duration = 1.6, start = "top 85%", className = "font-mono-tabular" }: Props) {
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
      scrollTrigger: { trigger: el, start, once: true },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      el.textContent = final;
    };
  }, [value, duration, reducedMotion, final, start]);

  return (
    <span className={`${className} whitespace-nowrap`}>
      <span className="sr-only">
        {final}
        {suffix}
      </span>
      {/* mono: width fixed to the final string (tabular digits, so no layout shift while counting). Another face's
          digits don't measure in ch: there the number just grows to the right. */}
      <span aria-hidden="true">
        <span
          ref={ref}
          className="inline-block text-end"
          style={className === "font-mono-tabular" ? { width: `${final.length}ch` } : undefined}
        >
          {final}
        </span>
        {suffix}
      </span>
    </span>
  );
}
