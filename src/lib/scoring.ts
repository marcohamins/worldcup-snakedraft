import type {
  DraftData,
  LeaderboardEntry,
  MatchSummary,
  ScoreBreakdown,
  ScoringRules,
  TeamData,
} from "./types";
import { getOwnedTeams } from "./draft";

const KNOCKOUT_STAGE_POINTS: Record<string, keyof ScoringRules> = {
  LAST_32: "round_of_32_win",
  LAST_16: "round_of_16_win",
  QUARTER_FINALS: "quarterfinal_win",
  SEMI_FINALS: "semifinal_win",
  FINAL: "final_win",
  THIRD_PLACE: "third_place_win",
};

export function hasKnockoutInvolvement(
  teamName: string,
  matches: MatchSummary[],
): boolean {
  return matches.some(
    (match) =>
      match.stage !== "GROUP_STAGE" &&
      (match.homeTeam.name === teamName || match.awayTeam.name === teamName),
  );
}

export function getKnockoutWinPoints(
  stage: string,
  scoring: ScoringRules,
): number {
  const key = KNOCKOUT_STAGE_POINTS[stage];
  if (!key) {
    return 0;
  }
  return scoring[key] as number;
}

export function calculateTeamScore(
  teamName: string,
  matches: MatchSummary[],
  groupPosition: number | null,
  groupComplete: boolean,
  scoring: ScoringRules,
): ScoreBreakdown {
  const teamMatches = matches.filter(
    (match) =>
      match.homeTeam.name === teamName || match.awayTeam.name === teamName,
  );

  let groupWins = 0;
  let groupDraws = 0;
  const knockoutWins: Record<string, number> = {};

  for (const match of teamMatches) {
    if (match.status !== "FINISHED") {
      continue;
    }

    const isHome = match.homeTeam.name === teamName;
    const teamWon =
      (isHome && match.winner === "HOME") ||
      (!isHome && match.winner === "AWAY");
    const teamDrew = match.winner === "DRAW";

    if (match.stage === "GROUP_STAGE") {
      if (teamWon) {
        groupWins += 1;
      } else if (teamDrew) {
        groupDraws += 1;
      }
      continue;
    }

    if (teamWon) {
      const points = getKnockoutWinPoints(match.stage, scoring);
      knockoutWins[match.stage] = (knockoutWins[match.stage] ?? 0) + points;
    }
  }

  let groupFirstPlaceBonus = 0;
  let groupSecondPlaceBonus = 0;
  let groupThirdPlaceAdvanceBonus = 0;

  if (groupComplete && groupPosition === 1) {
    groupFirstPlaceBonus = scoring.group_first_place;
  } else if (groupComplete && groupPosition === 2) {
    groupSecondPlaceBonus = scoring.group_second_place;
  } else if (
    groupComplete &&
    groupPosition === 3 &&
    hasKnockoutInvolvement(teamName, matches)
  ) {
    groupThirdPlaceAdvanceBonus = scoring.group_third_place_advance;
  }

  const knockoutTotal = Object.values(knockoutWins).reduce(
    (sum, value) => sum + value,
    0,
  );

  const total =
    groupWins * scoring.group_win +
    groupDraws * scoring.group_draw +
    groupFirstPlaceBonus +
    groupSecondPlaceBonus +
    groupThirdPlaceAdvanceBonus +
    knockoutTotal;

  return {
    groupWins,
    groupDraws,
    groupFirstPlaceBonus,
    groupSecondPlaceBonus,
    groupThirdPlaceAdvanceBonus,
    knockoutWins,
    total,
  };
}

export function calculatePlayerScore(
  participant: string,
  teams: TeamData[],
  draft: DraftData,
): number {
  return getOwnedTeams(participant, teams, draft).reduce(
    (sum, team) => sum + team.score,
    0,
  );
}

export function calculateLeaderboard(
  participants: string[],
  teams: TeamData[],
  draft: DraftData,
): LeaderboardEntry[] {
  const scored = participants.map((participant) => {
    const ownedTeams = getOwnedTeams(participant, teams, draft);
    const totalScore = ownedTeams.reduce((sum, team) => sum + team.score, 0);
    const teamsRemaining = ownedTeams.filter((team) => team.remaining).length;
    const bestTeam = ownedTeams.reduce<TeamData | null>((best, team) => {
      if (!best || team.score > best.score) {
        return team;
      }
      return best;
    }, null);

    const worstTeam = ownedTeams.reduce<TeamData | null>((worst, team) => {
      if (!worst || team.score < worst.score) {
        return team;
      }
      return worst;
    }, null);

    const teamScores = Object.fromEntries(
      ownedTeams.map((team) => [team.name, team.score]),
    );

    return {
      participant,
      totalScore,
      teamsRemaining,
      ownedTeams: ownedTeams.map((team) => ({
        name: team.name,
        crest: team.crest,
        remaining: team.remaining,
        score: team.score,
      })),
      bestTeam: bestTeam
        ? { name: bestTeam.name, score: bestTeam.score }
        : null,
      worstTeam: worstTeam
        ? { name: worstTeam.name, score: worstTeam.score }
        : null,
      teamScores,
    };
  });

  scored.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.participant.localeCompare(b.participant);
  });

  const leaderScore = scored[0]?.totalScore ?? 0;

  return scored.map((entry, index) => ({
    rank: index + 1,
    participant: entry.participant,
    totalScore: entry.totalScore,
    teamsRemaining: entry.teamsRemaining,
    pointsBehindLeader: leaderScore - entry.totalScore,
    ownedTeams: entry.ownedTeams,
    bestTeam: entry.bestTeam,
    worstTeam: entry.worstTeam,
    teamScores: entry.teamScores,
  }));
}
