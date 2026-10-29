"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "./gsap";
import { useReducedMotion } from "./useReducedMotion";

type Props = {
  as?: "h1" | "h2" | "p";
  className?: string;
  /** Above the fold: reveal on mount, no ScrollTrigger, hidden by CSS before first paint. */
  immediate?: boolean;
  /** Played by someone else: registers as data-intro="<name>" and leaves the reveal to the intro timeline
   *  (src/components/intro/IntroTimeline.ts). Split into masked words in the server HTML, so the reveal never
   *  replaces the text that painted first (the LCP) and the words re-wrap on resize by themselves. */
  manual?: string;
  children: string;
};

const TRIGGER = { start: "top 85%", once: true } as const;

export function RevealText({ as: Tag = "p", className, immediate = false, manual, children }: Props) {
  const ref = useRef<HTMLHeadingElement & HTMLParagraphElement>(null);
  const reducedMotion = useReducedMotion();

  // Scroll reveals get their hidden state here, after mount, so the text stays readable without JS.
  // Immediate reveals are hidden earlier by `.js [data-reveal-immediate]` in globals.css;
  // data-revealed hands control to GSAP once its own start state is set.
  useEffect(() => {
    const el = ref.current;
    if (!el || manual) return;
    const trigger = immediate ? {} : { scrollTrigger: { trigger: el, ...TRIGGER } };
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3, ...trigger });
        el.dataset.revealed = "";
        return;
      }
      // autoSplit re-splits on resize and font load; returning the tween lets SplitText rebuild it.
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "reveal-line",
        autoSplit: true,
        onSplit: (self) => {
          const tween = gsap.from(self.lines, {
            yPercent: 100,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.06,
            ...trigger,
          });
          el.dataset.revealed = "";
          return tween;
        },
      });
    }, el);
    return () => ctx.revert();
  }, [reducedMotion, immediate, manual, children]);

  return (
    <Tag
      ref={ref}
      className={className}
      data-reveal-immediate={(immediate && !manual) || undefined}
      data-intro={manual}
    >
      {manual
        ? children.split(" ").map((word, i) => (
            <span key={i}>
              {i > 0 && " "}
              <span className="reveal-line-mask inline-block overflow-hidden align-bottom">
                <span className="reveal-word inline-block">{word}</span>
              </span>
            </span>
          ))
        : children}
    </Tag>
  );
}
