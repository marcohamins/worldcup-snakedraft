import { calculateTeamScore } from "../scoring";
import type { ScoringRules, TeamData } from "../types";
import {
  getCompletedCheckpoint,
  matchesThroughStage,
  type StageCheckpoint,
} from "./stages";

function groupStateAtCheckpoint(
  team: TeamData,
  checkpoint: StageCheckpoint,
): { groupPosition: number | null; groupComplete: boolean } {
  if (checkpoint === "GROUP_STAGE") {
    return {
      groupPosition: team.groupComplete ? team.groupPosition : null,
      groupComplete: team.groupComplete,
    };
  }
  return {
    groupPosition: team.groupPosition,
    groupComplete: team.groupComplete,
  };
}

export function getLiveParticipantScores(
  participants: string[],
  draft: Record<string, string>,
  teams: TeamData[],
  checkpoint: StageCheckpoint | null,
  scoring: ScoringRules,
): Record<string, number> {
  const scores = Object.fromEntries(
    participants.map((participant) => [participant, 0]),
  );

  if (!checkpoint) {
    return scores;
  }

  const teamByName = Object.fromEntries(teams.map((team) => [team.name, team]));

  for (const [teamName, owner] of Object.entries(draft)) {
    const team = teamByName[teamName];
    if (!team) {
      continue;
    }

    const { groupPosition, groupComplete } = groupStateAtCheckpoint(
      team,
      checkpoint,
    );
    const matches = matchesThroughStage(team.matches, checkpoint);
    const score = calculateTeamScore(
      teamName,
      matches,
      groupPosition,
      groupComplete,
      scoring,
    ).total;

    scores[owner] = (scores[owner] ?? 0) + score;
  }

  return scores;
}

export { getCompletedCheckpoint };
