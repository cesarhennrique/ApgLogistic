"use client";

import { useEffect, useRef } from "react";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { SHAPES, ServiceObject } from "@/components/layout/ServiceHero";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { DESKTOP_QUERY, motionSafe, PHONE_QUERY } from "@/lib/phoneLayout";
import { measure, setText, viewport } from "@/components/journey/measure";

const pad = (n: number) => String(n).padStart(2, "0");
const N = site.services.length;
// The truck's tyre radius over its picture's width (carreta-lado: hubs at 639, tyres' line at 700).
const TYRE = (700 - 639) / 1672;

// The services (spec §4, APGU 1996-07), in the journey's language: a panel a service, each its page hero's
// composition (light, the giant word, the object on the ground line with its shadow and its dimension), the title,
// one line, three of what it includes and the link. Wide screens: pinned, the panels run sideways with the scroll
// (two screens of it); each object comes in from the right ahead of its panel, on the ground line (the truck rolling,
// its wheels turning by the distance), its word slower behind (parallax); a counter and a bar keep count. Phones,
// and reduced motion: the panels one under the other, each object coming in from the side as its panel shows (not
// with reduced motion).
export function ServicesTrack() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const mm = gsap.matchMedia();
    const panels = [...track.current!.querySelectorAll<HTMLElement>("[data-panel]")];
    const parts = panels.map((p) => ({
      object: p.querySelector<HTMLElement>("[data-object]")!,
      word: p.querySelector<HTMLElement>("[data-word]")!,
      rims: [...p.querySelectorAll<HTMLElement>("[data-rim]")],
    }));
    mm.add(motionSafe(DESKTOP_QUERY), () => {
      const apply = (p: number) => {
        const W = viewport().width;
        const at = p * (N - 1);
        track.current!.style.transform = `translate3d(${(-at * W).toFixed(1)}px, 0, 0)`;
        parts.forEach(({ object, word, rims }, i) => {
          // the panel's place in screens (0 in view, 1 one to the right): the object ahead of it, the word behind
          const rel = i - at;
          const dx = rel * 0.45 * W;
          object.style.transform = `translate3d(${dx.toFixed(1)}px, 0, 0)`;
          word.style.transform = `translate3d(${(-rel * 0.5 * W).toFixed(1)}px, 0, 0)`;
          // rolling, not sliding: the wheels turn by the truck's own travel over the tyre's radius
          const travel = rel * 1.45 * W;
          const radius = TYRE * measure(object.firstElementChild as HTMLElement).width;
          for (const rim of rims) rim.style.transform = `rotate(${((travel / radius) * (180 / Math.PI)).toFixed(1)}deg)`;
        });
        setText(counter.current!, `${pad(Math.round(at) + 1)}/${pad(N)}`);
        bar.current!.style.transform = `scaleX(${((at + 1) / N).toFixed(4)})`;
      };
      const trigger = ScrollTrigger.create({
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });
      apply(trigger.progress);
      return () => {
        track.current?.style.removeProperty("transform");
        for (const { object, word, rims } of parts) {
          object.style.removeProperty("transform");
          word.style.removeProperty("transform");
          for (const rim of rims) rim.style.removeProperty("transform");
        }
      };
    });
    // The phone's layout (lib/phoneLayout): each panel's object in from the side once it shows (a CSS transition on data-in).
    mm.add(motionSafe(PHONE_QUERY), () => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) if (e.isIntersecting) (e.target as HTMLElement).setAttribute("data-in", "");
        },
        { threshold: 0.35 },
      );
      for (const p of panels) io.observe(p);
      return () => io.disconnect();
    });
    return () => mm.revert();
  }, []);

  const { services: copy } = site.home;
  return (
    // It slides up over the distribution's last screen, held for it (not with reduced motion: then it simply follows).
    <section
      ref={section}
      data-surface="light"
      data-header-theme="light"
      aria-labelledby="services-title"
      className="relative z-10 bg-[#fefefe] text-navy-900 motion-safe:desk:-mt-[100svh] motion-safe:desk:h-[300vh]"
    >
      <h2 id="services-title" className="sr-only">
        {copy.title}
      </h2>
      <div className="motion-safe:desk:sticky motion-safe:desk:top-0 motion-safe:desk:h-svh motion-safe:desk:overflow-hidden">
        <div ref={track} className="motion-safe:desk:flex motion-safe:desk:h-full motion-safe:desk:w-[300vw]">
          {site.services.map((service, i) => {
            const shape = SHAPES[service.slug];
            return (
              <article
                key={service.slug}
                data-panel=""
                className="group relative isolate flex min-h-svh flex-col overflow-hidden pb-[10svh] md:block md:h-svh md:min-h-0 md:pb-0 motion-safe:desk:w-screen motion-safe:desk:shrink-0"
              >
                {/* the giant word behind */}
                <div aria-hidden="true" className="absolute inset-x-0 top-[58%] -z-10 md:top-1/2 md:-translate-y-1/2">
                  <p
                    data-word=""
                    data-decor="" className="font-condensed pl-[4vw] text-[30vw] leading-none font-bold whitespace-nowrap text-[#EDEBE6] uppercase md:text-[22vw]"
                  >
                    {service.word}
                  </p>
                </div>
                <div className="site-container relative pt-24 md:pt-32">
                  <div className="md:max-w-[38%]">
                    <ContainerCode index={homeCode("services")} label={`${copy.code} · ${pad(i + 1)}/${pad(N)}`} />
                    <h3 className="font-condensed mt-4 text-5xl leading-[0.9] font-bold uppercase md:text-[clamp(3rem,4.6vw,5rem)]">
                      {service.title}
                    </h3>
                    <p className="mt-5 max-w-[40ch] text-lg leading-snug text-navy-900/70">{service.summary}</p>
                    <ul className="mt-6 grid gap-2.5">
                      {service.bullets.slice(0, 3).map((b) => (
                        <li key={b} className="border-l-2 border-red-500 pl-3 leading-snug">
                          {b}
                        </li>
                      ))}
                    </ul>
                    <TransitionLink
                      href={`/servicos/${service.slug}`}
                      className="group/link mt-8 inline-flex min-h-11 items-center gap-3 text-sm font-semibold tracking-wide uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-900"
                    >
                      {copy.more}
                      <span className="sr-only">: {service.title}</span>
                      <span
                        aria-hidden="true"
                        className="mask-arrow h-[0.72em] w-[1.6em] bg-red-500 transition-transform duration-150 ease-out group-hover/link:translate-x-1 motion-reduce:transition-none"
                      />
                    </TransitionLink>
                  </div>
                </div>
                {/* the object on the ground line; on phones in from the side as the panel shows */}
                <div className="relative mt-8 min-h-[34svh] flex-1 md:absolute md:top-28 md:right-[4vw] md:bottom-[14svh] md:left-[44%] md:mt-0">
                  <div
                    data-object=""
                    className={`absolute inset-x-4 bottom-0 flex items-end justify-center md:inset-x-0 ${shape.tall ? "top-0" : ""} phone:transition-[translate,opacity] phone:duration-700 phone:ease-out motion-safe:phone:translate-x-[45%] motion-safe:phone:opacity-0 motion-safe:phone:group-data-in:translate-x-0 motion-safe:phone:group-data-in:opacity-100`}
                  >
                    <ServiceObject service={service} rims />
                  </div>
                </div>
                <div aria-hidden="true" className="absolute inset-x-0 bottom-[10svh] h-px bg-navy-900/35 md:bottom-[14svh]" />
              </article>
            );
          })}
        </div>
        {/* wide screens: the count and the bar, over the panels */}
        <div aria-hidden="true" className="pointer-events-none absolute right-[4vw] bottom-[5svh] hidden items-center gap-4 font-mono text-xs tracking-[0.12em] motion-safe:desk:flex">
          <span ref={counter} className="tabular-nums">
            01/{pad(N)}
          </span>
          <span className="h-px w-40 bg-navy-900/20">
            <span ref={bar} className="block h-full origin-left bg-red-500" style={{ transform: `scaleX(${1 / N})` }} />
          </span>
        </div>
      </div>
    </section>
  );
}
