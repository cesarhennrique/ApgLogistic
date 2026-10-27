import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ContainerCode } from "@/components/ui/ContainerCode";
import { CtaButton } from "@/components/ui/CtaButton";
import { site } from "@/content/site";

export function FinalCta() {
  const { code, title, text } = site.home.finalCta;
  return (
    <section data-surface="light" className="bg-sand-50 py-24 text-navy-900 md:py-36">
      <div className="site-container">
        <ContainerCode index={7} label={code} />
        <h2 className="font-condensed mt-5 max-w-[12ch] text-6xl leading-[0.88] font-bold uppercase md:text-[clamp(5rem,9vw,9rem)]">
          {title}
        </h2>
        <p className="mt-6 max-w-xl text-lg text-navy-900/75">{text}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <CtaButton href="/contato">{site.cta.quote}</CtaButton>
          <WhatsAppButton variant="inline" />
        </div>
      </div>
    </section>
  );
}
