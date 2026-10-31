"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/content/site";
import { TransitionLink } from "./TransitionLink";

// The links' ink follows the header's tone (sand over dark scenes, navy over light ones); the current page is
// underlined in red.
const LINK =
  "relative py-2 font-mono text-[11px] tracking-[0.16em] uppercase text-sand-50 group-data-[tone=dark]/header:text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--focus-ring)";
const CURRENT = "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-red-500";

// Wide screens (≥ 1280 px): site.nav inline. "Serviços" opens its list of services below it (the menu overlay's
// submenu, as a dropdown): on click, closed by Escape, a click outside or focus leaving it.
export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const group = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !group.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Closed again on every route change.
  const [route, setRoute] = useState(pathname);
  if (route !== pathname) {
    setRoute(pathname);
    setOpen(false);
  }

  return (
    <nav aria-label={site.ui.menuLabel} className="max-xl:hidden">
      <ul className="flex items-center gap-7">
        {site.nav.map((item) =>
          "children" in item ? (
            <li
              key={item.label}
              ref={group}
              className="relative"
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(false)}
            >
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((o) => !o)}
                className={`${LINK} flex items-center gap-1.5 ${item.children.some((c) => c.href === pathname) ? CURRENT : ""}`}
              >
                {item.label}
                <span aria-hidden="true" className={`transition-transform duration-150 ease-out ${open ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
              <ul
                id={panelId}
                className={`absolute top-full left-0 mt-3 min-w-64 origin-top border border-sand-50/10 bg-navy-900/95 p-2 backdrop-blur-md transition-[opacity,transform,visibility] duration-150 ease-out ${open ? "opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"}`}
              >
                {item.children.map((child) => (
                  <li key={child.href}>
                    <TransitionLink
                      href={child.href}
                      aria-current={child.href === pathname ? "page" : undefined}
                      className="block px-3 py-2.5 text-sm text-sand-50/85 hover:text-sand-50 focus-visible:outline-2 focus-visible:outline-(--color-sand-50)"
                    >
                      {child.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </li>
          ) : (
            <li key={item.href}>
              <TransitionLink
                href={item.href}
                aria-current={item.href === pathname ? "page" : undefined}
                className={`${LINK} ${item.href === pathname ? CURRENT : ""}`}
              >
                {item.label}
              </TransitionLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
