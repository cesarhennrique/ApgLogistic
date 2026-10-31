import Image from "next/image";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { homeCode } from "@/content/homeSections";
import { site } from "@/content/site";

// Hidden until the client sends authorised logos (spec §2).
export function Clients() {
  if (site.clients.length === 0) return null;

  const list = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-16 pr-16 motion-reduce:flex-wrap">
      {site.clients.map((c) => (
        <li key={c.name}>
          <Image src={c.logo} alt={hidden ? "" : c.name} width={160} height={64} className="h-12 w-auto opacity-80" />
        </li>
      ))}
    </ul>
  );

  return (
    <section className="overflow-hidden bg-navy-900 py-20 md:py-28">
      <div className="site-container">
        <ContainerCode index={homeCode("clients")} label={site.home.clients.code} />
        <h2 className="sr-only">{site.home.clients.title}</h2>
      </div>
      {/* two copies + translateX(-50%) loop seamlessly; reduced motion shows one static, wrapping list */}
      <div className="mt-12 flex w-max animate-marquee hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none">
        {list(false)}
        <div className="contents motion-reduce:hidden">{list(true)}</div>
      </div>
    </section>
  );
}
