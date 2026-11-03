import { Clients } from "@/components/home/Clients";
import { Differentials } from "@/components/home/Differentials";
import { FinalCta } from "@/components/home/FinalCta";
import { Journey } from "@/components/home/Journey";
import { ServicesTrack } from "@/components/home/ServicesTrack";

// The order of spec §4 ("Ordem da Home"), as in content/homeSections.ts; Clients stays hidden until there are logos.
export default function Home() {
  return (
    <main className="flex-1">
      <Journey />
      <ServicesTrack />
      <Differentials />
      <Clients />
      <FinalCta />
    </main>
  );
}
