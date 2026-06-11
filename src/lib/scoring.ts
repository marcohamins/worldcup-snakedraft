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

export function computeGroupRecordFromMatches(
  teamName: string,
  matches: MatchSummary[],
): TeamData["groupRecord"] {
  let wins = 0;
  let draws = 0;
  let losses = 0;

  for (const match of matches) {
    if (match.stage !== "GROUP_STAGE" || match.status !== "FINISHED") {
      continue;
    }
    if (match.homeTeam.name !== teamName && match.awayTeam.name !== teamName) {
      continue;
    }

    const isHome = match.homeTeam.name === teamName;
    const teamWon =
      (isHome && match.winner === "HOME") ||
      (!isHome && match.winner === "AWAY");
    const teamDrew = match.winner === "DRAW";
    const teamLost =
      (isHome && match.winner === "AWAY") ||
      (!isHome && match.winner === "HOME");

    if (teamWon) {
      wins += 1;
    } else if (teamDrew) {
      draws += 1;
    } else if (teamLost) {
      losses += 1;
    }
  }

  return { wins, draws, losses };
}

interface GroupTableRow {
  teamName: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

/** Group positions from FINISHED group-stage matches (1-based). */
export function computeGroupPositionsFromMatches(
  allMatches: MatchSummary[],
): Map<string, number> {
  const tables = new Map<string, Map<string, GroupTableRow>>();

  for (const match of allMatches) {
    if (match.stage !== "GROUP_STAGE" || match.status !== "FINISHED") {
      continue;
    }
    if (!match.group || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    if (!tables.has(match.group)) {
      tables.set(match.group, new Map());
    }
    const table = tables.get(match.group)!;

    for (const teamName of [match.homeTeam.name, match.awayTeam.name]) {
      if (!table.has(teamName)) {
        table.set(teamName, {
          teamName,
          points: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
        });
      }
    }

    const home = table.get(match.homeTeam.name)!;
    const away = table.get(match.awayTeam.name)!;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.winner === "HOME") {
      home.points += 3;
    } else if (match.winner === "AWAY") {
      away.points += 3;
    } else if (match.winner === "DRAW") {
      home.points += 1;
      away.points += 1;
    }
  }

  const positions = new Map<string, number>();

  for (const table of tables.values()) {
    for (const row of table.values()) {
      row.goalDifference = row.goalsFor - row.goalsAgainst;
    }

    const ranked = [...table.values()].sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      return b.goalsFor - a.goalsFor;
    });

    ranked.forEach((row, index) => {
      positions.set(row.teamName, index + 1);
    });
  }

  return positions;
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
