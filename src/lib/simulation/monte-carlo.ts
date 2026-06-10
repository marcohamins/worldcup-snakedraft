import type { ParticipantProjection, SimulationData } from "./types";
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

export function runMonteCarlo(
  data: SimulationData,
  iterations = data.simConfig.defaultSimCount,
): {
  iterations: number;
  finishedMatches: number;
  remainingMatches: number;
  projections: ParticipantProjection[];
  histogramBins: { participant: string; bins: { score: number; count: number }[] }[];
} {
  const { finished, remaining } = countMatchStatus(data.fixtures);
  const scoreSamples = Object.fromEntries(
    data.participants.map((participant) => [participant, [] as number[]]),
  );

  for (let i = 0; i < iterations; i += 1) {
    const result = runSimulation(data, 1000 + i);
    for (const participant of data.participants) {
      scoreSamples[participant].push(result.participantScores[participant] ?? 0);
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
      const median =
        scores.length % 2 === 0
          ? (scores[mid - 1] + scores[mid]) / 2
          : scores[mid];

      return {
        participant,
        mean:
          scores.reduce((sum, value) => sum + value, 0) /
          (scores.length || 1),
        median,
        p10: percentile(scores, 0.1),
        p90: percentile(scores, 0.9),
        winProbability: winCounts[participant] / iterations,
        scores,
      };
    },
  );

  projections.sort((a, b) => b.mean - a.mean);

  return {
    iterations,
    finishedMatches: finished,
    remainingMatches: remaining,
    projections,
    histogramBins: projections.map((projection) =>
      buildHistogram(projection.participant, projection.scores),
    ),
  };
}
