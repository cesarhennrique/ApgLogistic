import { Clock, Landmark, type LucideIcon, Ship, Truck } from "lucide-react";
import { site } from "@/content/site";

// One line icon per pillar, in site.home.hero.pillars' order.
const ICONS: LucideIcon[] = [Ship, Truck, Clock, Landmark];

// The hero's bottom band: the operation's four pillars, a slanted rule between them on wide screens, a 2×2 grid on
// phones.
export function HeroStrip() {
  return (
    <div data-intro="strip" className="border-t border-sand-50/10">
      <ul className="site-container grid grid-cols-2 gap-x-4 gap-y-3 py-3 md:grid-cols-4 md:gap-y-4 md:py-4 md:gap-x-0 md:py-5">
        {site.home.hero.pillars.map((p, i) => {
          const Icon = ICONS[i];
          return (
            <li key={p.title} className="flex items-start gap-3 md:px-6 md:first:pl-0">
              {i > 0 && (
                <span aria-hidden="true" className="-ml-6 font-mono text-lg leading-none text-sand-50/25 max-md:hidden">
                  /
                </span>
              )}
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-red-500" strokeWidth={1.5} />
              <span className="min-w-0">
                <span className="block font-mono text-[11px] tracking-[0.16em] text-sand-50 uppercase">{p.title}</span>
                <span className="mt-1 block text-sm text-sand-50/75">{p.text}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
