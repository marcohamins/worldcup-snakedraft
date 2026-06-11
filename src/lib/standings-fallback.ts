import { isMatchResolved } from "./matchdays";
import type { MatchSummary } from "./types";

export interface StandingsTableRow {
  team: { name: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface StandingsGroup {
  group: string;
  table: StandingsTableRow[];
}

interface GroupStats {
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

function normalizeGroupLabel(group: string): string {
  if (group.startsWith("GROUP_")) {
    return group.replace("GROUP_", "Group ");
  }
  return group;
}

function findStandingRow(
  teamName: string,
  group: string | null,
  standings: StandingsGroup[],
): StandingsTableRow | null {
  if (!group) {
    return null;
  }

  const standing = standings.find(
    (entry) => normalizeGroupLabel(entry.group) === group,
  );
  return standing?.table.find((row) => row.team.name === teamName) ?? null;
}

function getResolvedGroupStats(
  teamName: string,
  matches: MatchSummary[],
): GroupStats {
  const stats: GroupStats = {
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
  };

  for (const match of matches) {
    if (match.stage !== "GROUP_STAGE" || !isMatchResolved(match)) {
      continue;
    }

    const isHome = match.homeTeam.name === teamName;
    const isAway = match.awayTeam.name === teamName;
    if (!isHome && !isAway) {
      continue;
    }

    const homeScore = match.homeScore!;
    const awayScore = match.awayScore!;
    stats.played += 1;
    stats.goalsFor += isHome ? homeScore : awayScore;
    stats.goalsAgainst += isHome ? awayScore : homeScore;

    if (match.winner === "DRAW") {
      stats.draw += 1;
      continue;
    }

    const teamWon =
      (isHome && match.winner === "HOME") ||
      (isAway && match.winner === "AWAY");
    if (teamWon) {
      stats.won += 1;
    } else {
      stats.lost += 1;
    }
  }

  return stats;
}

function inferMatchResult(
  match: MatchSummary,
  matches: MatchSummary[],
  standings: StandingsGroup[],
): Pick<MatchSummary, "homeScore" | "awayScore" | "winner"> | null {
  if (
    match.stage !== "GROUP_STAGE" ||
    match.status !== "FINISHED" ||
    isMatchResolved(match)
  ) {
    return null;
  }

  const homeRow = findStandingRow(match.homeTeam.name, match.group, standings);
  const awayRow = findStandingRow(match.awayTeam.name, match.group, standings);
  if (!homeRow || !awayRow) {
    return null;
  }

  const homeResolved = getResolvedGroupStats(match.homeTeam.name, matches);
  const awayResolved = getResolvedGroupStats(match.awayTeam.name, matches);

  const homeDelta = {
    played: homeRow.playedGames - homeResolved.played,
    won: homeRow.won - homeResolved.won,
    draw: homeRow.draw - homeResolved.draw,
    lost: homeRow.lost - homeResolved.lost,
    goalsFor: homeRow.goalsFor - homeResolved.goalsFor,
    goalsAgainst: homeRow.goalsAgainst - homeResolved.goalsAgainst,
  };
  const awayDelta = {
    played: awayRow.playedGames - awayResolved.played,
    won: awayRow.won - awayResolved.won,
    draw: awayRow.draw - awayResolved.draw,
    lost: awayRow.lost - awayResolved.lost,
    goalsFor: awayRow.goalsFor - awayResolved.goalsFor,
    goalsAgainst: awayRow.goalsAgainst - awayResolved.goalsAgainst,
  };

  if (homeDelta.played !== 1 || awayDelta.played !== 1) {
    return null;
  }

  if (
    homeDelta.goalsFor !== awayDelta.goalsAgainst ||
    homeDelta.goalsAgainst !== awayDelta.goalsFor
  ) {
    return null;
  }

  const homeScore = homeDelta.goalsFor;
  const awayScore = homeDelta.goalsAgainst;

  if (homeDelta.won === 1 && awayDelta.lost === 1) {
    return { homeScore, awayScore, winner: "HOME" };
  }

  if (awayDelta.won === 1 && homeDelta.lost === 1) {
    return { homeScore, awayScore, winner: "AWAY" };
  }

  if (
    homeDelta.draw === 1 &&
    awayDelta.draw === 1 &&
    homeScore === awayScore
  ) {
    return { homeScore, awayScore, winner: "DRAW" };
  }

  return null;
}

export function applyStandingsFallback(
  matches: MatchSummary[],
  standings: StandingsGroup[],
): MatchSummary[] {
  return matches.map((match) => {
    const inferred = inferMatchResult(match, matches, standings);
    if (!inferred) {
      return match;
    }

    return {
      ...match,
      ...inferred,
    };
  });
}
