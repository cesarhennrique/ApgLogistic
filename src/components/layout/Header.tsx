"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/components/motion/gsap";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";
import { journeyProgress } from "@/three/progress";
import { stageBackground } from "@/three/stages/background";
import { MenuOverlay } from "./MenuOverlay";
import { TransitionLink } from "./TransitionLink";

const MENU_ID = "site-menu";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  // Tagged with the route it was measured on: after leaving Home, a stale "over the journey" never applies.
  const [journey, setJourney] = useState({ path: "", visible: false });
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Over the 3D journey the header stays see-through (a solid bar would crop the frame); per route, since
  // only Home has #journey.
  useEffect(() => {
    const el = document.getElementById("journey");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setJourney({ path: pathname, visible: entry.isIntersecting }));
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  const overJourney = journey.path === pathname && journey.visible;
  const solid = scrolled && !overJourney;

  // Logo and menu follow the stage under them: white on navy, navy on sand. Written straight to the DOM, and
  // only when the tone flips (stageBackground, the same color as the 3D background).
  useEffect(() => {
    const header = headerRef.current!;
    if (!overJourney) {
      header.dataset.tone = "light";
      return;
    }
    const tick = () => {
      const tone = stageBackground(journeyProgress.value).r > 0.5 ? "dark" : "light";
      if (header.dataset.tone !== tone) header.dataset.tone = tone;
    };
    tick();
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [overJourney]);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        data-intro="header"
        data-tone="light"
        className="group/header fixed inset-x-0 top-0 z-50 data-[tone=dark]:[--focus-ring:var(--color-navy-900)]"
        data-solid={solid || undefined}
      >
        {/* the solid state fades in on its own layer, so only opacity animates */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 border-b border-sand-50/10 bg-navy-900/90 backdrop-blur-md transition-opacity duration-200 ease-out ${solid ? "opacity-100" : "opacity-0"}`}
        />
        {/* Over the journey: just enough navy behind the logo and menu to read them, 40% → 0 over 120 px. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-linear-to-b from-navy-900/40 to-transparent transition-opacity duration-200 ease-out group-data-[tone=dark]/header:opacity-0 ${overJourney ? "opacity-100" : "opacity-0"}`}
        />
        <div className="site-container relative flex h-16 items-center justify-between gap-3 md:h-20">
          <TransitionLink
            href="/"
            className="relative shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)"
          >
            <Image
              src="/brand/logo-mark-white.svg"
              alt={site.name}
              width={4960}
              height={2423}
              priority
              className="h-8 w-auto transition-opacity duration-200 ease-out group-data-[tone=dark]/header:opacity-0 md:h-10"
            />
            {/* The navy logo on sand stages: the same mark as a mask, crossfaded (opacity only). */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-navy-900 opacity-0 transition-opacity duration-200 ease-out [mask:url(/brand/logo-mark-white.svg)_center/contain_no-repeat] group-data-[tone=dark]/header:opacity-100"
            />
          </TransitionLink>
          <div className="flex items-center gap-2 md:gap-6">
            {/* Below md the hero carries the CTA; the header keeps just logo and menu. */}
            <div className="max-md:hidden">
              <CtaButton href="/contato">{site.cta.quote}</CtaButton>
            </div>
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={open}
              aria-controls={MENU_ID}
              onClick={() => setOpen(true)}
              className="grid min-h-11 min-w-11 items-center justify-center text-sm font-semibold tracking-wide uppercase transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--focus-ring)"
            >
              {/* Two stacked copies, sand and navy, crossfaded with the tone (opacity only). */}
              {(["text-sand-50 group-data-[tone=dark]/header:opacity-0", "text-navy-900 opacity-0 group-data-[tone=dark]/header:opacity-100"] as const).map(
                (tone, i) => (
                  <span
                    key={tone}
                    aria-hidden={i > 0 || undefined}
                    className={`col-start-1 row-start-1 flex items-center justify-center gap-3 transition-opacity duration-200 ease-out ${tone}`}
                  >
                    <span className="max-md:sr-only">{site.ui.openMenu}</span>
                    <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
                      <span className="h-0.5 w-6 bg-current" />
                      <span className="h-0.5 w-4 self-end bg-current" />
                    </span>
                  </span>
                ),
              )}
            </button>
          </div>
        </div>
      </header>
      <MenuOverlay id={MENU_ID} open={open} onClose={close} />
    </>
  );
}
