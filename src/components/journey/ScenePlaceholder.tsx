import { ContainerCode } from "@/components/ui/ContainerCode";
import type { JourneyScene } from "@/content/site";
import { Scene } from "./Scene";

type Props = { scene: JourneyScene; index: number; heightVh: number; background: string; headerTheme: "dark" | "light" };

// A journey scene not built yet: its real height and background, and its line. shortcut: J2–J4 replace each one.
export function ScenePlaceholder({ scene, index, heightVh, background, headerTheme }: Props) {
  const ink = headerTheme === "dark" ? "text-sand-50" : "text-navy-900";
  return (
    <Scene id={scene.id} heightVh={heightVh} background={background} headerTheme={headerTheme}>
      <div className={`site-container flex h-full flex-col justify-center ${ink}`}>
        <ContainerCode index={index} label={scene.code} />
        {scene.text && (
          <p className="font-condensed mt-4 max-w-[16ch] text-[clamp(2.25rem,6vw,5rem)] leading-[0.92] font-bold uppercase">
            {scene.text}
          </p>
        )}
      </div>
    </Scene>
  );
}
