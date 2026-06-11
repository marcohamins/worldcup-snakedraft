import type { MatchSummary } from "../types";

/** Checkpoints used for expected-vs-actual tracking (FINAL includes 3rd-place match). */
export const STAGE_CHECKPOINTS = [
  "GROUP_STAGE",
  "LAST_32",
  "LAST_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
] as const;

export type StageCheckpoint = (typeof STAGE_CHECKPOINTS)[number];

const STAGES_INCLUDED: Record<StageCheckpoint, string[]> = {
  GROUP_STAGE: ["GROUP_STAGE"],
  LAST_32: ["GROUP_STAGE", "LAST_32"],
  LAST_16: ["GROUP_STAGE", "LAST_32", "LAST_16"],
  QUARTER_FINALS: [
    "GROUP_STAGE",
    "LAST_32",
    "LAST_16",
    "QUARTER_FINALS",
  ],
  SEMI_FINALS: [
    "GROUP_STAGE",
    "LAST_32",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
  ],
  FINAL: [
    "GROUP_STAGE",
    "LAST_32",
    "LAST_16",
    "QUARTER_FINALS",
    "SEMI_FINALS",
    "THIRD_PLACE",
    "FINAL",
  ],
};

const STAGE_MATCH_COUNTS: Record<StageCheckpoint, number> = {
  GROUP_STAGE: 72,
  LAST_32: 16,
  LAST_16: 8,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 2,
  FINAL: 2,
};

export function matchesThroughStage(
  matches: MatchSummary[],
  checkpoint: StageCheckpoint,
): MatchSummary[] {
  const allowed = new Set(STAGES_INCLUDED[checkpoint]);
  return matches.filter((match) => allowed.has(match.stage));
}

/** Highest fully completed stage based on finished fixtures. */
export function getCompletedCheckpoint(
  fixtures: MatchSummary[],
): StageCheckpoint | null {
  let lastComplete: StageCheckpoint | null = null;

  for (const stage of STAGE_CHECKPOINTS) {
    const stageFixtures = fixtures.filter((fixture) => {
      if (stage === "FINAL") {
        return fixture.stage === "THIRD_PLACE" || fixture.stage === "FINAL";
      }
      return fixture.stage === stage;
    });
    const finished = stageFixtures.filter(
      (fixture) => fixture.status === "FINISHED",
    ).length;
    if (finished >= STAGE_MATCH_COUNTS[stage]) {
      lastComplete = stage;
    } else {
      break;
    }
  }

  return lastComplete;
}

export function formatCheckpointLabel(checkpoint: StageCheckpoint): string {
  const labels: Record<StageCheckpoint, string> = {
    GROUP_STAGE: "Group stage",
    LAST_32: "Round of 32",
    LAST_16: "Round of 16",
    QUARTER_FINALS: "Quarter-finals",
    SEMI_FINALS: "Semi-finals",
    FINAL: "Final",
  };
  return labels[checkpoint];
}
