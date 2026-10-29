"use client";

import { gsap, SplitText } from "@/components/motion/gsap";
import { MAP_INTRO_MS, setMapIntro } from "./bridge";

// The hero's entrance (spec §5, "Entrada do hero"), in seconds from the loader's exit. Every element registers
// with data-intro="<name>"; none of them animates its own entrance.
export const INTRO = {
  map: { at: 0, duration: MAP_INTRO_MS / 1000 },
  code: { at: 0.5, duration: 0.4 },
  title: { at: 0.65, duration: 0.7, stagger: 0.09 },
  subtitle: { at: 1.1, duration: 0.5 },
  actions: { at: 1.3, duration: 0.5 },
  header: { at: 1.3, duration: 0.4 },
  strip: { at: 1.6, duration: 0.5 },
  // Later visits in the session: the same sequence, squeezed into this.
  short: 0.6,
} as const;

const EASE = "power3.out";

const find = (name: string) => document.querySelector<HTMLElement>(`[data-intro="${name}"]`);

// Builds and plays the entrance. Elements missing from the page are skipped. Resolves when it ends.
export async function playIntro({ short }: { short: boolean }): Promise<void> {
  await document.fonts.ready;
  const code = find("code");
  const title = find("title");
  const subtitle = find("subtitle");
  const actions = find("actions");
  const header = find("header");
  const strip = find("strip");

  let chars: SplitText | null = null;
  const tl = gsap.timeline({ paused: true });

  const map = { t: 0 };
  setMapIntro(0);
  tl.to(map, { t: 1, duration: INTRO.map.duration, ease: "none", onUpdate: () => setMapIntro(map.t) }, INTRO.map.at);

  if (code) {
    // Typed: each character switches on in turn.
    chars = SplitText.create(code, { type: "chars" });
    // Hidden now, switched on one by one later (zero-length staggered tweens would render their end at once).
    gsap.set(chars.chars, { opacity: 0 });
    tl.to(chars.chars, { opacity: 1, duration: 0.001, ease: "none", stagger: INTRO.code.duration / chars.chars.length }, INTRO.code.at);
  }
  if (title) {
    // The words come masked from the server (RevealText manual); a line is the words sharing a top.
    const lines = new Map<number, HTMLElement[]>();
    for (const word of title.querySelectorAll<HTMLElement>(".reveal-word")) {
      const top = Math.round((word.parentElement as HTMLElement).offsetTop);
      lines.set(top, [...(lines.get(top) ?? []), word]);
    }
    [...lines.values()].forEach((words, i) => {
      tl.fromTo(
        words,
        // Past the mask's 0.12em of extra room (kept for Ç and accents), so nothing peeks before the reveal.
        { yPercent: 125 },
        { yPercent: 0, duration: INTRO.title.duration, ease: EASE },
        INTRO.title.at + i * INTRO.title.stagger,
      );
    });
  }
  const rise = (el: Element | Element[], { at, duration }: { at: number; duration: number }, stagger = 0) =>
    tl.fromTo(el, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration, ease: EASE, stagger }, at);
  if (subtitle) rise(subtitle, INTRO.subtitle);
  if (actions) rise([...actions.children], INTRO.actions, 0.08);
  if (header) tl.fromTo(header, { yPercent: -100 }, { yPercent: 0, duration: INTRO.header.duration, ease: EASE }, INTRO.header.at);
  if (strip) rise(strip, INTRO.strip);

  // From states are in place (the fromTo's render at once): hand the elements over from the CSS that hid them.
  for (const el of [code, title, subtitle, actions, header, strip]) el?.setAttribute("data-intro-ready", "");

  if (short) tl.timeScale(tl.duration() / INTRO.short);
  await new Promise<void>((resolve) => tl.eventCallback("onComplete", resolve).play());
  // The code back to plain text.
  chars?.revert();
  gsap.set([header, strip, subtitle, ...(actions ? actions.children : [])].filter(Boolean), { clearProps: "transform" });
}
