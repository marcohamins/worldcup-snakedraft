import type { StageCheckpoint } from "./stages";

export interface SimBaseline {
  generatedAt: string;
  iterations: number;
  stageMedians: Partial<Record<StageCheckpoint, Record<string, number>>>;
  finalMedians: Record<string, number>;
}
