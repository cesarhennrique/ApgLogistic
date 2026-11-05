import { site } from "@/content/site";

const { track, history } = site.journeyScene;

// The history's chapters, still (scene 4's track, for reduced motion and /sobre): its title, the first line muted,
// then each chapter's mark, title and line.
export function History({ as: Title = "p" }: { as?: "p" | "h2" }) {
  return (
    <>
      <Title className="font-condensed text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.9] font-bold uppercase">
        {track.title.map((line, i) => (
          <span key={line} className={`block ${i === 0 ? "text-navy-900/60" : ""}`}>
            {line}
          </span>
        ))}
      </Title>
      <ol className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {history.map((ch) => (
          <li key={ch.title} className="border-l-2 border-red-500 pl-4">
            <p className="font-condensed text-[clamp(2rem,3.4vw,3rem)] leading-none font-bold uppercase">{ch.mark}</p>
            <p className="mt-2 font-mono text-xs tracking-[0.12em] text-blue-600 uppercase">{ch.title}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-snug text-navy-900/80">{ch.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
