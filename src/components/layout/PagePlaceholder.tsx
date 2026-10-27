import { RevealText } from "@/components/motion/RevealText";

// shortcut: provisional page body until each route gets its real content (Prompt 05).
export function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-32 pb-24 md:px-10 md:pt-44">
      <RevealText as="h1" immediate className="font-condensed text-6xl leading-[0.9] font-bold uppercase md:text-9xl">
        {title}
      </RevealText>
    </main>
  );
}
