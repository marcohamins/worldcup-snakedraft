import type { MatchSummary } from "../types";
import type { GroupTableRow, ResolvedMatch } from "./types";

function groupLetter(group: string | null): string | null {
  if (!group) {
    return null;
  }
  return group.replace("Group ", "");
}

export function initGroupTables(
  groupLetters: string[],
  teamsByGroup: Map<string, string[]>,
  ratings: Map<string, number>,
): Map<string, Map<string, GroupTableRow>> {
  const tables = new Map<string, Map<string, GroupTableRow>>();

  for (const letter of groupLetters) {
    const table = new Map<string, GroupTableRow>();
    for (const teamName of teamsByGroup.get(letter) ?? []) {
      table.set(teamName, {
        teamName,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        peleRating: ratings.get(teamName) ?? 0,
      });
    }
    tables.set(letter, table);
  }

  return tables;
}

function applyResult(
  table: Map<string, GroupTableRow>,
  homeTeam: string,
  awayTeam: string,
  result: ResolvedMatch,
): void {
  const home = table.get(homeTeam);
  const away = table.get(awayTeam);
  if (!home || !away) {
    return;
  }

  home.goalsFor += result.homeScore;
  home.goalsAgainst += result.awayScore;
  away.goalsFor += result.awayScore;
  away.goalsAgainst += result.homeScore;

  if (result.winner === "HOME") {
    home.points += 3;
  } else if (result.winner === "AWAY") {
    away.points += 3;
  } else {
    home.points += 1;
    away.points += 1;
  }

  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

export function simulateGroupStage(
  fixtures: MatchSummary[],
  lockedResults: Map<number, ResolvedMatch>,
  simulatedResults: Map<number, ResolvedMatch>,
  groupLetters: string[],
  teamsByGroup: Map<string, string[]>,
  ratings: Map<string, number>,
): MatchSummary[] {
  const tables = initGroupTables(groupLetters, teamsByGroup, ratings);
  const completed: MatchSummary[] = [];

  const groupFixtures = fixtures.filter(
    (fixture) => fixture.stage === "GROUP_STAGE",
  );

  for (const fixture of groupFixtures) {
    if (
      fixture.homeTeam.name === "TBD" ||
      fixture.awayTeam.name === "TBD"
    ) {
      continue;
    }

    const locked = lockedResults.get(fixture.id);
    const simulated = simulatedResults.get(fixture.id);
    const result = locked ?? simulated;
    if (!result) {
      continue;
    }

    const letter = groupLetter(fixture.group);
    if (!letter) {
      continue;
    }

    const table = tables.get(letter);
    if (table) {
      applyResult(
        table,
        fixture.homeTeam.name,
        fixture.awayTeam.name,
        result,
      );
    }

    completed.push({
      ...fixture,
      status: "FINISHED",
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      winner: result.winner,
    });
  }

  return completed;
}

export function rankGroupTables(
  tables: Map<string, Map<string, GroupTableRow>>,
): {
  first: Map<string, string>;
  second: Map<string, string>;
  third: Map<string, string>;
  thirdStats: Map<string, GroupTableRow>;
} {
  const first = new Map<string, string>();
  const second = new Map<string, string>();
  const third = new Map<string, string>();
  const thirdStats = new Map<string, GroupTableRow>();

  for (const [letter, table] of tables) {
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

    if (ranked[0]) {
      first.set(letter, ranked[0].teamName);
    }
    if (ranked[1]) {
      second.set(letter, ranked[1].teamName);
    }
    if (ranked[2]) {
      third.set(letter, ranked[2].teamName);
      thirdStats.set(letter, ranked[2]);
    }
  }

  return { first, second, third, thirdStats };
}

export function rankThirdPlaceTeams(
  thirdStats: Map<string, GroupTableRow>,
): string[] {
  return [...thirdStats.entries()]
    .sort(([, a], [, b]) => {
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
    })
    .slice(0, 8)
    .map(([letter]) => letter);
}

export function buildTeamsByGroup(
  teamsMeta: Record<string, { name: string; group: string | null }>,
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const team of Object.values(teamsMeta)) {
    if (!team.group) {
      continue;
    }
    const list = map.get(team.group) ?? [];
    list.push(team.name);
    map.set(team.group, list);
  }

  return map;
}

export function rebuildGroupTablesFromResults(
  groupLetters: string[],
  teamsByGroup: Map<string, string[]>,
  ratings: Map<string, number>,
  completedGroupMatches: MatchSummary[],
): Map<string, Map<string, GroupTableRow>> {
  const tables = initGroupTables(groupLetters, teamsByGroup, ratings);

  for (const match of completedGroupMatches) {
    const letter = groupLetter(match.group);
    if (!letter || match.homeScore === null || match.awayScore === null) {
      continue;
    }

    const table = tables.get(letter);
    if (!table) {
      continue;
    }

    applyResult(table, match.homeTeam.name, match.awayTeam.name, {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      winner: match.winner ?? "DRAW",
    });
  }

  return tables;
}
