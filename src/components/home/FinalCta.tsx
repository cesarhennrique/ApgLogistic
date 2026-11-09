"use client";

import { useEffect, useRef } from "react";
import { TruckShadow } from "@/components/journey/TruckShadow";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { gsap, ScrollTrigger } from "@/components/motion/gsap";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";
import { DESKTOP_QUERY, motionSafe, PHONE_QUERY } from "@/lib/phoneLayout";

const pad = (n: number) => String(n).padStart(2, "0");
// The doors' swing when open, and the order the contacts come out in (over the opening's progress).
const OPEN = 108;
const DOORS = [0.05, 0.7] as const;
const CONTACT = (i: number) => [0.45 + i * 0.12, 0.62 + i * 0.12] as const;
const seg = (p: number, [a, b]: readonly [number, number]) =>
  Math.min(Math.max((p - a) / (b - a), 0), 1);
const easeOut = (x: number) => 1 - (1 - x) ** 3;
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;

// One door of an APG container seen from the end: its corrugation, the red stripe, two locking bars with their
// handles; the left one carries the container's code. Its inside face behind it (seen once it swings past 90°).
function Door({ side }: { side: "left" | "right" }) {
  const { lat, lon } = site.journeyScene.hud.to;
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 [transform:rotateY(180deg)] bg-[#141f4d] [backface-visibility:hidden] bg-[repeating-linear-gradient(90deg,transparent_0_9%,rgb(10_19_56/0.6)_9%_10%)]"
      />
      <svg
        viewBox="0 0 110 240"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full [backface-visibility:hidden]"
        aria-hidden="true"
      >
        <rect width={110} height={240} className="fill-[#1b2a63]" />
        {Array.from({ length: 10 }, (_, i) => (
          <path
            key={i}
            d={`M${6 + i * 10.8} 6V234`}
            className="stroke-navy-900/55"
            strokeWidth={1.2}
          />
        ))}
        <rect y={96} width={110} height={12} className="fill-red-500" />
        {[30, 80].map((x) => (
          <g key={x} className="fill-none stroke-steel-400" strokeWidth={2}>
            <path d={`M${x} 10V230`} />
            <path
              d={`M${x} 150h${side === "left" ? 14 : -14}`}
              strokeWidth={3}
            />
            <rect x={x - 4} y={14} width={8} height={8} />
            <rect x={x - 4} y={218} width={8} height={8} />
          </g>
        ))}
        {side === "left" && (
          <text
            x={10}
            y={40}
            className="fill-sand-50 font-mono text-[9px] tracking-[0.08em]"
          >
            APGU 1996-{pad(homeCode("finalCta"))}
          </text>
        )}
        {side === "right" && (
          <text
            x={100}
            y={40}
            textAnchor="end"
            className="fill-sand-50/70 font-mono text-[7px]"
          >
            {lat[0]}°{lat[1]}′S {lon[0]}°{lon[1]}′W
          </text>
        )}
      </svg>
    </>
  );
}

// The final call (spec §4, APGU 1996-09): the copy at the left; at the right an APG container seen from its end,
// standing on its ground line, its two doors swinging open in 3D as you scroll (phones: as it comes in, once), and
// out of it, one after the other, the ways to reach APG: the quote, WhatsApp (when set), the 24 h phone, the
// terminal's address and its coordinates. Reduced motion: open, everything out, still (the page's own markup: the
// script only closes the doors to play them).
export function FinalCta() {
  const { code, title, text } = site.home.finalCta;
  const box = useRef<HTMLDivElement>(null);
  const { matriz } = site.addresses;
  const phone = site.phones[0];
  const { lat, lon } = site.journeyScene.hud.to;

  useEffect(() => {
    const el = box.current!;
    const [left, right] = [...el.querySelectorAll<HTMLElement>("[data-door]")];
    const contacts = [...el.querySelectorAll<HTMLElement>("[data-contact]")];
    // A keyboard's focus inside opens it all (the contacts stay in the tab order, see-through until they are out).
    let held = false;
    const apply = (scrolled: number) => {
      const p = held ? 1 : scrolled;
      const swing = OPEN * easeInOut(seg(p, DOORS));
      left.style.transform = `rotateY(${-swing}deg)`;
      right.style.transform = `rotateY(${swing}deg)`;
      contacts.forEach((c, i) => {
        const k = easeOut(seg(p, CONTACT(i)));
        c.style.opacity = String(k);
        c.style.transform = `translate3d(0, ${((1 - k) * 18).toFixed(1)}px, 0)`;
      });
    };
    let last = 0;
    const track = (p: number) => apply((last = p));
    const onFocusIn = () => {
      held = true;
      apply(last);
    };
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return;
      held = false;
      apply(last);
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    const reset = () => {
      for (const d of [left, right]) d.style.removeProperty("transform");
      for (const c of contacts)
        for (const p of ["opacity", "transform"])
          c.style.removeProperty(p);
    };
    const mm = gsap.matchMedia();
    // wide screens: scrubbed as the section scrolls through
    mm.add(
      motionSafe(DESKTOP_QUERY),
      () => {
        const t = ScrollTrigger.create({
          trigger: el,
          start: "top 65%",
          end: "center 35%",
          scrub: true,
          onUpdate: (s) => track(s.progress),
        });
        track(t.progress);
        return reset;
      },
    );
    // phones: played once, as the container comes in
    mm.add(
      motionSafe(PHONE_QUERY),
      () => {
        const state = { p: 0 };
        track(0);
        const tween = gsap.to(state, {
          p: 1,
          duration: 1.8,
          ease: "none",
          onUpdate: () => track(state.p),
          scrollTrigger: { trigger: el, start: "top 75%", once: true },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          reset();
        };
      },
    );
    return () => {
      mm.revert();
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <section
      data-surface="light"
      data-header-theme="light"
      className="relative overflow-hidden bg-sand-50 py-24 text-navy-900 md:py-32"
    >
      <div className="site-container grid items-center gap-14 md:grid-cols-2 md:gap-10">
        <div className="max-md:order-2">
          <ContainerCode index={homeCode("finalCta")} label={code} />
          <h2 className="font-condensed mt-5 max-w-[12ch] text-6xl leading-[0.88] font-bold uppercase md:text-[clamp(4.5rem,7.5vw,8rem)]">
            {title}
          </h2>
          <p className="mt-6 max-w-xl text-lg text-navy-900/75">{text}</p>
        </div>
        {/* The container on its ground line, its doors over its open end. */}
        <div className="relative mx-auto w-full max-w-[22rem] md:max-w-[30rem]">
          <div
            ref={box}
            className="relative aspect-[240/260] [perspective:1600px]"
          >
            <TruckShadow y={1} depth={0.06} left={-0.06} width={1.12} />
            {/* the frame: posts, rails, corner castings */}
            <div className="absolute inset-0 bg-navy-900 shadow-[inset_0_0_0_6px_#0a1338]" />
            {/* inside: the ways to reach APG */}
            <ul className="absolute inset-[5%] flex flex-col justify-center gap-4 bg-[#050a20] p-5 text-sand-50 md:gap-5 md:p-7">
              <li data-contact="">
                <CtaButton href={site.cta.quoteHref}>{site.cta.quote}</CtaButton>
              </li>
              {site.whatsapp && (
                <li data-contact="">
                  <WhatsAppButton variant="inline" />
                </li>
              )}
              <li data-contact="">
                <a
                  href={phone.href}
                  className="inline-flex min-h-11 flex-col justify-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand-50"
                >
                  <span className="font-mono text-xs tracking-[0.12em] text-sand-50/70 uppercase">
                    {site.ui.phone} · 24 h
                  </span>
                  <span className="font-mono-tabular text-xl md:text-2xl">
                    {phone.display}
                  </span>
                </a>
              </li>
              <li
                data-contact=""
                className="text-sm leading-snug text-sand-50/80"
              >
                <p>{matriz.street}</p>
                <p>{matriz.complement}</p>
                <p>
                  {matriz.city} – {matriz.state}
                </p>
                {/* (sand, not red: small red text on navy falls short of AA; the red is the mark before it) */}
                <p className="mt-1 flex items-center gap-2 font-mono text-xs tracking-[0.12em] text-sand-50">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-red-500" />
                  {lat[0]}°{lat[1]}′S {lon[0]}°{lon[1]}′W
                </p>
              </li>
            </ul>
            {/* the doors, hinged on the posts: open by default (the script closes them to play them) */}
            <div
              data-door=""
              className="absolute inset-y-[3%] left-[3%] w-[47%] origin-left [transform:rotateY(-108deg)] [transform-style:preserve-3d]"
            >
              <Door side="left" />
            </div>
            <div
              data-door=""
              className="absolute inset-y-[3%] right-[3%] w-[47%] origin-right [transform:rotateY(108deg)] [transform-style:preserve-3d]"
            >
              <Door side="right" />
            </div>
            {/* the corner castings, over it all */}
            {[
              "top-0 left-0",
              "top-0 right-0",
              "bottom-0 left-0",
              "right-0 bottom-0",
            ].map((at) => (
              <span
                key={at}
                aria-hidden="true"
                className={`absolute ${at} size-[6%] border border-steel-400/60 bg-navy-900`}
              />
            ))}
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-x-[-20%] bottom-0 h-px bg-navy-900/35"
          />
        </div>
      </div>
    </section>
  );
}
