"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { lenisRef } from "@/components/motion/SmoothScroll";
import { site, type NavLink } from "@/content/site";
import { TransitionLink } from "./TransitionLink";

type Props = { id: string; open: boolean; onClose: () => void };

// Items rise through an overflow-hidden mask, the same gesture as RevealText.
const RISE =
  "block translate-y-full transition-transform duration-150 ease-out group-data-[open=true]/menu:translate-y-0 group-data-[open=true]/menu:duration-300 motion-reduce:translate-y-0";

const delay = (open: boolean, index: number) => ({ transitionDelay: open ? `${index * 40}ms` : "0ms" });

function MenuLink({
  link,
  index,
  open,
  onClose,
  size,
}: {
  link: NavLink;
  index: number;
  open: boolean;
  onClose: () => void;
  size: "lg" | "sm";
}) {
  return (
    <span className="block overflow-hidden">
      <span className={RISE} style={delay(open, index)}>
        <TransitionLink
          href={link.href}
          onClick={onClose}
          className={`group/link inline-flex items-center gap-[0.25em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand-50 ${
            size === "lg"
              ? "font-condensed py-1 text-5xl leading-none font-bold md:text-8xl"
              : "py-2 text-lg font-semibold tracking-wide text-sand-50/80 hover:text-sand-50 md:text-xl"
          }`}
        >
          {link.label}
          <span
            aria-hidden="true"
            className="mask-arrow h-[0.45em] w-[1em] -translate-x-2 bg-red-500 opacity-0 transition-[opacity,transform] duration-150 ease-out group-hover/link:translate-x-0 group-hover/link:opacity-100 group-focus-visible/link:translate-x-0 group-focus-visible/link:opacity-100 motion-reduce:translate-x-0"
          />
        </TransitionLink>
      </span>
    </span>
  );
}

export function MenuOverlay({ id, open, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!open || !el) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    lenisRef.current?.stop();
    el.querySelector<HTMLElement>("nav a[href]")?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>("a[href], button")];
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !el.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !el.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      lenisRef.current?.start();
    };
  }, [open, onClose]);

  let index = 0;

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={site.ui.menuLabel}
      inert={!open}
      data-open={open}
      // visibility only transitions on close (it must flip to visible at once so focus() works on open)
      className="group/menu pointer-events-none invisible fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-navy-900 opacity-0 transition-[opacity,visibility] duration-150 ease-out data-[open=true]:pointer-events-auto data-[open=true]:visible data-[open=true]:opacity-100 data-[open=true]:transition-opacity data-[open=true]:duration-200"
    >
      <div className="site-container flex h-16 shrink-0 items-center justify-between md:h-20">
        <TransitionLink
          href="/"
          onClick={onClose}
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand-50"
        >
          <Image src="/brand/logo-mark-white.svg" alt={site.name} width={4960} height={2423} className="h-8 w-auto md:h-10" />
        </TransitionLink>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-11 min-w-11 items-center justify-center gap-3 text-sm font-semibold tracking-wide uppercase transition-transform duration-150 ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sand-50"
        >
          <span className="max-md:sr-only">{site.ui.closeMenu}</span>
          <span aria-hidden="true" className="relative block size-5">
            <span className="absolute top-1/2 left-0 h-0.5 w-5 rotate-45 bg-current" />
            <span className="absolute top-1/2 left-0 h-0.5 w-5 -rotate-45 bg-current" />
          </span>
        </button>
      </div>

      <nav aria-label={site.ui.menuLabel} className="site-container flex-1 py-8 md:py-12">
        <ul className="flex flex-col gap-2 md:gap-3">
          {site.nav.map((item) =>
            "children" in item ? (
              <li key={item.label} className="py-2">
                <span className="block overflow-hidden">
                  <span
                    className={`font-condensed text-5xl leading-none font-bold text-steel-400 uppercase md:text-8xl ${RISE}`}
                    style={delay(open, index++)}
                  >
                    {item.label}
                  </span>
                </span>
                <ul className="mt-2 border-l border-red-500 pl-4 md:pl-6">
                  {item.children.map((child) => (
                    <li key={child.href}>
                      <MenuLink link={child} index={index++} open={open} onClose={onClose} size="sm" />
                    </li>
                  ))}
                </ul>
              </li>
            ) : (
              <li key={item.href}>
                <MenuLink link={item} index={index++} open={open} onClose={onClose} size="lg" />
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="site-container flex flex-wrap gap-x-8 gap-y-2 pb-8 text-sm text-steel-400">
        {site.phones.map((p) => (
          <a key={p.href} href={p.href} className="hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-sand-50">
            {p.display}
          </a>
        ))}
        {Object.values(site.addresses).map((a) => (
          <span key={a.label}>
            {a.label}: {a.city} – {a.state}
          </span>
        ))}
      </div>
    </div>
  );
}
