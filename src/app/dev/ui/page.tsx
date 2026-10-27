import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Counter } from "@/components/motion/Counter";
import { RevealText } from "@/components/motion/RevealText";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";

// Dev-only visual check of the primitives; not site content.
export const metadata: Metadata = { title: "UI", robots: { index: false } };

const palette = [
  { token: "navy-900", hex: "#0A1338", className: "bg-navy-900 ring-1 ring-inset ring-steel-400/30" },
  { token: "blue-600", hex: "#393185", className: "bg-blue-600" },
  { token: "red-500", hex: "#E31E24", className: "bg-red-500" },
  { token: "sand-50", hex: "#F3EFE7", className: "bg-sand-50 text-navy-900" },
  { token: "steel-400", hex: "#8B94A8", className: "bg-steel-400 text-navy-900" },
  { token: "sunset", hex: "#F2913D", className: "bg-sunset text-navy-900", note: "só 3D" },
];

function Section({ index, label, children }: { index: number; label: string; children: ReactNode }) {
  return (
    <section className="border-t border-steel-400/20 py-14 md:py-20">
      <ContainerCode index={index} label={label} />
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 md:px-10">
      <header className="py-16 md:py-24">
        <ContainerCode index={0} label="Design system" />
        <RevealText as="h1" className="font-condensed mt-6 text-5xl font-bold uppercase leading-[0.9] md:text-8xl">
          {site.tagline}
        </RevealText>
        <RevealText className="mt-6 max-w-xl text-lg text-steel-400">{site.description}</RevealText>
      </header>

      <Section index={1} label="Logo">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex aspect-[5/3] items-center justify-center bg-sand-50 p-10">
            <Image src="/brand/logo.svg" alt={site.name} width={4960} height={2953} className="h-auto w-full max-w-sm" />
          </div>
          <div className="flex aspect-[5/3] items-center justify-center bg-navy-900 p-10 ring-1 ring-inset ring-steel-400/30">
            <Image src="/brand/logo-white.svg" alt={site.name} width={4960} height={2953} className="h-auto w-full max-w-sm" />
          </div>
        </div>
      </Section>

      <Section index={2} label="Paleta">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-6">
          {palette.map((c) => (
            <li key={c.token} className={`flex aspect-[3/4] flex-col justify-end p-3 ${c.className}`}>
              <span className="text-sm font-semibold">{c.token}</span>
              <span className="font-mono-tabular text-xs opacity-80">
                {c.hex}
                {c.note && ` · ${c.note}`}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section index={3} label="Tipografia">
        <div className="flex flex-wrap items-end gap-x-10 gap-y-6">
          <div>
            <p className="font-mono-tabular mb-2 text-xs text-steel-400">Archivo · wdth 62%</p>
            <p data-testid="title-condensed" className="font-condensed w-fit whitespace-nowrap text-5xl font-bold uppercase md:text-7xl">
              Cabotagem
            </p>
          </div>
          <div>
            <p className="font-mono-tabular mb-2 text-xs text-steel-400">Archivo · wdth 100%</p>
            <p data-testid="title-normal" className="w-fit whitespace-nowrap text-5xl font-bold uppercase md:text-7xl">
              Cabotagem
            </p>
          </div>
        </div>
        <p className="font-mono-tabular mt-8 text-2xl">0123456789 · 1.900 TEUs</p>
      </Section>

      <Section index={4} label="Números">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse border-l border-red-500 pl-4">
              <dt className="mt-2 text-sm text-steel-400">{s.label}</dt>
              <dd className="text-2xl font-semibold md:text-4xl">
                <Counter value={s.value} suffix={s.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section index={5} label="Botões">
        <div className="flex flex-wrap gap-4">
          <CtaButton href="/contato">{site.cta.quote}</CtaButton>
          <CtaButton href="/contato" variant="ghost">
            {site.cta.specialist}
          </CtaButton>
        </div>
      </Section>
    </main>
  );
}
