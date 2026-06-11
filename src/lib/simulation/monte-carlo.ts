import type { ParticipantProjection, SimulationData } from "./types";
import { STAGE_CHECKPOINTS, type StageCheckpoint } from "./stages";
import { countMatchStatus, runSimulation } from "./tournament";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(p * (sorted.length - 1))),
  );
  return sorted[index];
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function buildHistogram(
  participant: string,
  scores: number[],
): { participant: string; bins: { score: number; count: number }[] } {
  const counts = new Map<number, number>();
  for (const score of scores) {
    counts.set(score, (counts.get(score) ?? 0) + 1);
  }

  return {
    participant,
    bins: [...counts.entries()]
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => a.score - b.score),
  };
}

export interface MonteCarloOptions {
  /** When false, simulate from scratch ignoring real results (pre-tournament baseline). */
  anchorResults?: boolean;
}

export function runMonteCarlo(
  data: SimulationData,
  iterations = data.simConfig.defaultSimCount,
  options: MonteCarloOptions = {},
): {
  iterations: number;
  finishedMatches: number;
  remainingMatches: number;
  totalMatches: number;
  anchorResults: boolean;
  projections: ParticipantProjection[];
  histogramBins: { participant: string; bins: { score: number; count: number }[] }[];
  stageMedians: Partial<Record<StageCheckpoint, Record<string, number>>>;
} {
  const anchorResults = options.anchorResults ?? true;
  const { finished, remaining } = countMatchStatus(data.fixtures);
  const scoreSamples = Object.fromEntries(
    data.participants.map((participant) => [participant, [] as number[]]),
  );
  const stageSamples = Object.fromEntries(
    STAGE_CHECKPOINTS.map((stage) => [
      stage,
      Object.fromEntries(
        data.participants.map((participant) => [participant, [] as number[]]),
      ),
    ]),
  ) as Record<StageCheckpoint, Record<string, number[]>>;

  for (let i = 0; i < iterations; i += 1) {
    const result = runSimulation(data, 1000 + i, { anchorResults });
    for (const participant of data.participants) {
      scoreSamples[participant].push(result.participantScores[participant] ?? 0);
    }
    for (const stage of STAGE_CHECKPOINTS) {
      const stageResult = result.stageScores[stage];
      if (!stageResult) {
        continue;
      }
      for (const participant of data.participants) {
        stageSamples[stage][participant].push(stageResult[participant] ?? 0);
      }
    }
  }

  const winCounts = Object.fromEntries(
    data.participants.map((participant) => [participant, 0]),
  );

  for (let sim = 0; sim < iterations; sim += 1) {
    const scores = data.participants.map(
      (participant) => scoreSamples[participant][sim],
    );
    const max = Math.max(...scores);
    const leaders = data.participants.filter(
      (participant, index) => scores[index] === max,
    );
    for (const leader of leaders) {
      winCounts[leader] += 1 / leaders.length;
    }
  }

  const projections: ParticipantProjection[] = data.participants.map(
    (participant) => {
      const scores = [...scoreSamples[participant]].sort((a, b) => a - b);
      const mid = Math.floor(scores.length / 2);
      const medianScore =
        scores.length % 2 === 0
          ? (scores[mid - 1] + scores[mid]) / 2
          : scores[mid];

      return {
        participant,
        mean:
          scores.reduce((sum, value) => sum + value, 0) /
          (scores.length || 1),
        median: medianScore,
        p10: percentile(scores, 0.1),
        p90: percentile(scores, 0.9),
        winProbability: winCounts[participant] / iterations,
        scores,
      };
    },
  );

  projections.sort((a, b) => b.mean - a.mean);

  const stageMedians: Partial<Record<StageCheckpoint, Record<string, number>>> =
    {};
  for (const stage of STAGE_CHECKPOINTS) {
    stageMedians[stage] = Object.fromEntries(
      data.participants.map((participant) => [
        participant,
        median(stageSamples[stage][participant]),
      ]),
    );
  }

  return {
    iterations,
    finishedMatches: finished,
    remainingMatches: remaining,
    totalMatches: 104,
    anchorResults,
    projections,
    histogramBins: projections.map((projection) =>
      buildHistogram(projection.participant, projection.scores),
    ),
    stageMedians,
  };
}
