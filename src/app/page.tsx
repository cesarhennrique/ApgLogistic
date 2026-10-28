import { Clients } from "@/components/home/Clients";
import { CoverageMap } from "@/components/home/CoverageMap";
import { Differentials } from "@/components/home/Differentials";
import { FinalCta } from "@/components/home/FinalCta";
import { Journey } from "@/components/home/Journey";
import { Services } from "@/components/home/Services";
import { Stats } from "@/components/home/Stats";

// Backgrounds alternate navy / sand for rhythm; Clients stays hidden until there are logos.
export default function Home() {
  return (
    <main className="flex-1">
      <Journey />
      <Services />
      <Stats />
      <Differentials />
      <Clients />
      <CoverageMap />
      <FinalCta />
    </main>
  );
}
