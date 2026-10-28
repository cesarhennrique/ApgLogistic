"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";
import { MenuOverlay } from "./MenuOverlay";
import { TransitionLink } from "./TransitionLink";

const MENU_ID = "site-menu";

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {/* the solid state fades in on its own layer, so only opacity animates */}
        <div
          aria-hidden="true"
          className={`absolute inset-0 border-b border-sand-50/10 bg-navy-900/90 backdrop-blur-md transition-opacity duration-200 ease-out ${solid ? "opacity-100" : "opacity-0"}`}
        />
        <div className="site-container relative flex h-16 items-center justify-between gap-3 md:h-20">
          <TransitionLink
            href="/"
            className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand-50"
          >
            <Image
              src="/brand/logo-mark-white.svg"
              alt={site.name}
              width={4960}
              height={2423}
              priority
              className="h-8 w-auto md:h-10"
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
              className="flex min-h-11 min-w-11 items-center justify-center gap-3 text-sm font-semibold tracking-wide uppercase transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sand-50"
            >
              <span className="max-md:sr-only">{site.ui.openMenu}</span>
              <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
                <span className="h-0.5 w-6 bg-current" />
                <span className="h-0.5 w-4 self-end bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>
      <MenuOverlay id={MENU_ID} open={open} onClose={close} />
    </>
  );
}
