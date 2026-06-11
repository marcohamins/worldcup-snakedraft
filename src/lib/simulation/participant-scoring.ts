import { calculateTeamScore } from "../scoring";
import type { MatchSummary } from "../types";
import type { GroupTableRow } from "./types";
import type { SimulationData } from "./types";
import { matchesThroughStage, type StageCheckpoint } from "./stages";

function isGroupComplete(
  groupLetters: string[],
  teamsByGroup: Map<string, string[]>,
  matches: MatchSummary[],
): boolean {
  return groupLetters.every((letter) => {
    const teamsInGroup = teamsByGroup.get(letter) ?? [];
    const playedCounts = teamsInGroup.map((name) =>
      matches.filter(
        (match) =>
          match.stage === "GROUP_STAGE" &&
          match.group === `Group ${letter}` &&
          match.status === "FINISHED" &&
          (match.homeTeam.name === name || match.awayTeam.name === name),
      ).length,
    );
    return playedCounts.every((count) => count >= 3);
  });
}

function groupPositionForTeam(
  teamName: string,
  groupLetter: string,
  tables: Map<string, Map<string, GroupTableRow>>,
): number | null {
  const table = tables.get(groupLetter);
  if (!table) {
    return null;
  }
  const ranked = [...table.values()].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return b.peleRating - a.peleRating;
  });
  const index = ranked.findIndex((row) => row.teamName === teamName);
  return index >= 0 ? index + 1 : null;
}

export function scoreParticipants(
  data: SimulationData,
  allMatches: MatchSummary[],
  tables: Map<string, Map<string, GroupTableRow>>,
  groupLetters: string[],
  teamsByGroup: Map<string, string[]>,
  checkpoint?: StageCheckpoint,
): Record<string, number> {
  const matches = checkpoint
    ? matchesThroughStage(allMatches, checkpoint)
    : allMatches;
  const groupComplete = isGroupComplete(groupLetters, teamsByGroup, matches);

  const participantScores = Object.fromEntries(
    data.participants.map((participant) => [participant, 0]),
  );

  for (const teamName of Object.keys(data.draft)) {
    const meta = data.teamsMeta[teamName];
    const groupLetter = meta?.group ?? null;
    const groupPosition =
      groupLetter && groupComplete
        ? groupPositionForTeam(teamName, groupLetter, tables)
        : null;

    const score = calculateTeamScore(
      teamName,
      matches,
      groupPosition,
      groupComplete,
      data.scoring,
    ).total;

    const owner = data.draft[teamName];
    if (owner) {
      participantScores[owner] = (participantScores[owner] ?? 0) + score;
    }
  }

  return participantScores;
}
