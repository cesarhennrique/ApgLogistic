"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

type Props = {
  as?: "h1" | "h2" | "p";
  className?: string;
  children: string;
};

const TRIGGER = { start: "top 85%", once: true } as const;

export function RevealText({ as: Tag = "p", className, children }: Props) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();

  // Initial hidden state is applied here, after mount, so the text stays readable without JS.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.from(el, { opacity: 0, duration: 0.3, scrollTrigger: { trigger: el, ...TRIGGER } });
        return;
      }
      // autoSplit re-splits on resize and font load; returning the tween lets SplitText rebuild it.
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 100,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            scrollTrigger: { trigger: el, ...TRIGGER },
          }),
      });
    }, el);
    return () => ctx.revert();
  }, [reducedMotion, children]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
