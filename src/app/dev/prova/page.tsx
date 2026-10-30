import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TruckPass } from "@/components/proof/TruckPass";

// Dev-only proof: photoreal AI cut-out driven by scroll, to validate the direction before the rewrite.
export const metadata: Metadata = { title: "Prova", robots: { index: false } };

export default function DevProofPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="bg-[#FEFEFE]">
      <div className="flex h-svh items-center justify-center bg-navy-900 text-sand-50">
        <p className="font-mono-tabular text-sm tracking-[0.2em]">ROLE PARA BAIXO ↓</p>
      </div>
      <TruckPass />
      <div className="h-svh bg-navy-900" />
    </main>
  );
}
