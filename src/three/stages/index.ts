import type { ComponentType } from "react";
import type { ChapterId } from "../chapters";
import type { StageCameras } from "./cameras";
import { CraneStage, keys as craneKeys } from "./CraneStage";
import { DistributionStage, keys as distributionKeys } from "./DistributionStage";
import { HeroMapStage, keys as heroKeys } from "./HeroMapStage";
import { HighwayStage, keys as highwayKeys } from "./HighwayStage";
import { LoadStage, keys as loadKeys } from "./LoadStage";
import { TerminalStage, keys as terminalKeys } from "./TerminalStage";
import { STAGE_ORIGINS } from "./timeline";

export type StageProps = { reducedMotion: boolean };

// Every chapter's stage: its scene, its camera keys (start, middle, end, in its own frame) and its origin.
export const STAGES: Record<ChapterId, { Stage: ComponentType<StageProps>; keys: StageCameras; origin: [number, number, number] }> = {
  hero: { Stage: HeroMapStage, keys: heroKeys, origin: STAGE_ORIGINS.hero },
  crane: { Stage: CraneStage, keys: craneKeys, origin: STAGE_ORIGINS.crane },
  load: { Stage: LoadStage, keys: loadKeys, origin: STAGE_ORIGINS.load },
  highway: { Stage: HighwayStage, keys: highwayKeys, origin: STAGE_ORIGINS.highway },
  terminal: { Stage: TerminalStage, keys: terminalKeys, origin: STAGE_ORIGINS.terminal },
  distribution: { Stage: DistributionStage, keys: distributionKeys, origin: STAGE_ORIGINS.distribution },
};
