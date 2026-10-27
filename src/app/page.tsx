import { Clients } from "@/components/home/Clients";
import { CoverageMap } from "@/components/home/CoverageMap";
import { Differentials } from "@/components/home/Differentials";
import { FinalCta } from "@/components/home/FinalCta";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Stats } from "@/components/home/Stats";

// Backgrounds alternate navy / sand for rhythm; Clients stays hidden until there are logos.
export default function Home() {
  return (
    <main className="flex-1">
      <Hero />
      <Services />
      <Stats />
      <Differentials />
      <Clients />
      <CoverageMap />
      <FinalCta />
    </main>
  );
}
