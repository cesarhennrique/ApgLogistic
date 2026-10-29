"use client";

import { useSyncExternalStore } from "react";
import { site } from "@/content/site";

const time = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", hour: "2-digit", minute: "2-digit" });

// Ticks on each minute boundary.
function subscribe(onChange: () => void) {
  let id: ReturnType<typeof setTimeout>;
  const next = () => {
    id = setTimeout(() => {
      onChange();
      next();
    }, 60_000 - (Date.now() % 60_000));
  };
  next();
  return () => clearTimeout(id);
}

// Client only: the server snapshot is empty, so the time never mismatches on hydration.
function SuapeClock() {
  const now = useSyncExternalStore(
    subscribe,
    () => time.format(Date.now()),
    () => "",
  );
  return (
    <span className="font-mono-tabular shrink-0">
      {site.home.hero.clock} <span className="text-sand-50">{now || "--:--"}</span>
    </span>
  );
}

const items = site.home.hero.ticker;

function TickerRun({ hidden = false }: { hidden?: boolean }) {
  return (
    <span aria-hidden={hidden || undefined} className="flex shrink-0">
      {items.map((item) => (
        <span key={item} className="flex shrink-0 items-center">
          <span className="px-5">{item}</span>
          <span aria-hidden="true">·</span>
        </span>
      ))}
    </span>
  );
}

// The hero's bottom band: scroll hint, Suape's local time and a slow ticker of the operation's numbers.
export function HeroStrip() {
  return (
    <div
      data-intro="strip"
      className="site-container flex h-12 items-center gap-6 border-t border-sand-50/10 font-mono text-[11px] tracking-[0.18em] text-sand-50/60 uppercase md:h-14"
    >
      <span className="shrink-0 max-md:hidden">{site.home.hero.scrollHint}</span>
      {/* Two runs, so the -50% loop is seamless; paused on hover and with reduced motion. */}
      <div className="min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none">
          <TickerRun />
          <TickerRun hidden />
        </div>
      </div>
      <SuapeClock />
    </div>
  );
}
