import type { ReactNode } from "react";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { site } from "@/content/site";

// The form's "ficha técnica" (spec §6, revisão 2026-11-05): sand paper on a faint technical grid, its APGU code at
// the top. Once sent it gets stamped (Stamp).
export function Sheet({ id, code, label, children }: { id?: string; code: number; label: string; children: ReactNode }) {
  return (
    <div
      id={id}
      className="relative scroll-mt-24 border border-navy-900/15 bg-sand-50 bg-[linear-gradient(to_right,rgb(10_19_56/0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgb(10_19_56/0.045)_1px,transparent_1px)] bg-[size:24px_24px] p-5 text-navy-900 md:p-10"
    >
      <div className="flex items-center justify-between gap-4 border-b border-navy-900/15 pb-4">
        <ContainerCode index={code} label={label} tone="text-navy-900/75" />
        <span aria-hidden="true" className="size-2.5 border-t border-r border-red-500/70" />
      </div>
      {children}
    </div>
  );
}

// The sent sheet's stamp: "RECEBIDO · APGU 1996-NN" in red line, pressed down with a slight turn (globals.css).
export function Stamp({ code }: { code: number }) {
  return (
    <span
      aria-hidden="true"
      data-stamp=""
      className="stamp inline-block shrink-0 border-[3px] border-double border-red-500 px-4 py-2 font-mono text-lg font-bold tracking-[0.14em] whitespace-nowrap text-red-500 uppercase md:text-xl"
    >
      {site.forms.stamp} · APGU 1996-{String(code).padStart(2, "0")}
    </span>
  );
}
