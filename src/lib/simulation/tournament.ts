import type { MatchSummary, TeamInfo } from "../types";
import { calculateTeamScore } from "../scoring";
import { buildRoundOf32Pairings } from "./bracket";
import {
  buildTeamsByGroup,
  rankGroupTables,
  rankThirdPlaceTeams,
  rebuildGroupTablesFromResults,
  simulateGroupStage,
} from "./group-stage";
import {
  getMatchProbabilities,
  sampleWinner,
  scoresFromWinner,
} from "./probabilities";
import { createRng, type Rng } from "./rng";
import type {
  ResolvedMatch,
  SimulationData,
} from "./types";

function teamInfo(name: string, meta?: TeamInfo): TeamInfo {
  if (meta) {
    return meta;
  }
  return {
    id: 0,
    name,
    shortName: name,
    tla: "TBD",
    crest: "",
  };
}

function buildTeamInfoMap(data: SimulationData): Map<string, TeamInfo> {
  const map = new Map<string, TeamInfo>();
  for (const meta of Object.values(data.teamsMeta)) {
    map.set(meta.name, {
      id: meta.id,
      name: meta.name,
      shortName: meta.name,
      tla: meta.tla,
      crest: "",
    });
  }
  return map;
}

function buildRatings(data: SimulationData): Map<string, number> {
  const ratings = new Map<string, number>();
  const peleValues = Object.values(data.peleRatings);
  const fallback =
    peleValues.reduce((sum, value) => sum + value, 0) /
    (peleValues.length || 1);

  for (const meta of Object.values(data.teamsMeta)) {
    const peleCode = data.peleOverrides[meta.tla] ?? meta.tla;
    ratings.set(meta.name, data.peleRatings[peleCode] ?? fallback);
  }

  return ratings;
}

function extractLockedResults(
  fixtures: MatchSummary[],
): Map<number, ResolvedMatch> {
  const locked = new Map<number, ResolvedMatch>();

  for (const fixture of fixtures) {
    if (fixture.status !== "FINISHED") {
      continue;
    }
    if (fixture.homeScore === null || fixture.awayScore === null) {
      continue;
    }

    locked.set(fixture.id, {
      homeScore: fixture.homeScore,
      awayScore: fixture.awayScore,
      winner: fixture.winner ?? "DRAW",
    });
  }

  return locked;
}

function simulateUnresolvedGroupMatches(
  fixtures: MatchSummary[],
  lockedResults: Map<number, ResolvedMatch>,
  ratings: Map<string, number>,
  config: SimulationData["simConfig"],
  rng: Rng,
): Map<number, ResolvedMatch> {
  const simulated = new Map<number, ResolvedMatch>();

  for (const fixture of fixtures) {
    if (fixture.stage !== "GROUP_STAGE") {
      continue;
    }
    if (lockedResults.has(fixture.id)) {
      continue;
    }
    if (
      fixture.homeTeam.name === "TBD" ||
      fixture.awayTeam.name === "TBD"
    ) {
      continue;
    }

    const probs = getMatchProbabilities(
      ratings.get(fixture.homeTeam.name) ?? 1500,
      ratings.get(fixture.awayTeam.name) ?? 1500,
      config,
      false,
    );
    const winner = sampleWinner(probs, rng.next(), false);
    const scores = scoresFromWinner(winner);
    simulated.set(fixture.id, {
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      winner,
    });
  }

  return simulated;
}

function playKnockoutMatch(
  matchNumber: number,
  stage: string,
  homeName: string,
  awayName: string,
  ratings: Map<string, number>,
  config: SimulationData["simConfig"],
  teamInfoMap: Map<string, TeamInfo>,
  rng: Rng,
): { match: MatchSummary; winner: string; loser: string } {
  const probs = getMatchProbabilities(
    ratings.get(homeName) ?? 1500,
    ratings.get(awayName) ?? 1500,
    config,
    true,
  );
  const winnerSide = sampleWinner(probs, rng.next(), true);
  const scores = scoresFromWinner(winnerSide);
  const winner = winnerSide === "HOME" ? homeName : awayName;
  const loser = winnerSide === "HOME" ? awayName : homeName;

  return {
    winner,
    loser,
    match: {
      id: matchNumber,
      utcDate: new Date().toISOString(),
      status: "FINISHED",
      stage,
      group: null,
      matchday: null,
      homeTeam: teamInfo(homeName, teamInfoMap.get(homeName)),
      awayTeam: teamInfo(awayName, teamInfoMap.get(awayName)),
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      winner: winnerSide,
      bookings: [],
    },
  };
}

export function runSimulation(
  data: SimulationData,
  seed: number,
): { participantScores: Record<string, number>; matches: MatchSummary[] } {
  const rng = createRng(seed);
  const ratings = buildRatings(data);
  const teamInfoMap = buildTeamInfoMap(data);
  const groupLetters = data.bracketMatrix.structure.groupLetters;
  const teamsByGroup = buildTeamsByGroup(data.teamsMeta);
  const lockedResults = extractLockedResults(data.fixtures);
  const simulatedGroup = simulateUnresolvedGroupMatches(
    data.fixtures,
    lockedResults,
    ratings,
    data.simConfig,
    rng,
  );

  const groupMatches = simulateGroupStage(
    data.fixtures,
    lockedResults,
    simulatedGroup,
    groupLetters,
    teamsByGroup,
    ratings,
  );

  const tables = rebuildGroupTablesFromResults(
    groupLetters,
    teamsByGroup,
    ratings,
    groupMatches,
  );
  const { first, second, third, thirdStats } = rankGroupTables(tables);
  const qualifyingGroups = rankThirdPlaceTeams(thirdStats);

  const thirdTeams = new Map<string, string>();
  for (const [letter, teamName] of third) {
    thirdTeams.set(letter, teamName);
  }

  const r32Pairings = buildRoundOf32Pairings(
    data.bracketMatrix,
    first,
    second,
    thirdTeams,
    qualifyingGroups,
  );

  const allMatches = [...groupMatches];
  const matchWinners = new Map<number, string>();
  const semiLosers: string[] = [];

  for (const pairing of r32Pairings) {
    if (pairing.home === "TBD" || pairing.away === "TBD") {
      continue;
    }
    const result = playKnockoutMatch(
      pairing.matchNumber,
      "LAST_32",
      pairing.home,
      pairing.away,
      ratings,
      data.simConfig,
      teamInfoMap,
      rng,
    );
    allMatches.push(result.match);
    matchWinners.set(pairing.matchNumber, result.winner);
  }

  const playFeederRound = (
    round: { match: number; feederA: number; feederB: number }[],
    stage: string,
  ): void => {
    for (const fixture of round) {
      const home = matchWinners.get(fixture.feederA);
      const away = matchWinners.get(fixture.feederB);
      if (!home || !away) {
        continue;
      }
      const result = playKnockoutMatch(
        fixture.match,
        stage,
        home,
        away,
        ratings,
        data.simConfig,
        teamInfoMap,
        rng,
      );
      allMatches.push(result.match);
      matchWinners.set(fixture.match, result.winner);
      if (stage === "SEMI_FINALS") {
        semiLosers.push(result.loser);
      }
    }
  };

  const { structure } = data.bracketMatrix;
  playFeederRound(structure.roundOf16, "LAST_16");
  playFeederRound(structure.quarterFinals, "QUARTER_FINALS");
  playFeederRound(structure.semiFinals, "SEMI_FINALS");

  if (semiLosers.length === 2) {
    const thirdPlace = playKnockoutMatch(
      structure.thirdPlace.match,
      "THIRD_PLACE",
      semiLosers[0],
      semiLosers[1],
      ratings,
      data.simConfig,
      teamInfoMap,
      rng,
    );
    allMatches.push(thirdPlace.match);
    matchWinners.set(structure.thirdPlace.match, thirdPlace.winner);
  }

  const finalHome = matchWinners.get(structure.final.feederA);
  const finalAway = matchWinners.get(structure.final.feederB);
  if (finalHome && finalAway) {
    const finalResult = playKnockoutMatch(
      structure.final.match,
      "FINAL",
      finalHome,
      finalAway,
      ratings,
      data.simConfig,
      teamInfoMap,
      rng,
    );
    allMatches.push(finalResult.match);
  }

  const draftedTeams = Object.keys(data.draft);
  const participantScores: Record<string, number> = Object.fromEntries(
    data.participants.map((participant) => [participant, 0]),
  );

  for (const teamName of draftedTeams) {
    const meta = data.teamsMeta[teamName];
    const groupLetter = meta?.group ?? null;
    const groupComplete = groupLetters.every((letter) => {
      const table = tables.get(letter);
      if (!table) {
        return false;
      }
      const teamsInGroup = teamsByGroup.get(letter) ?? [];
      const playedCounts = teamsInGroup.map((name) => {
        return allMatches.filter(
          (match) =>
            match.stage === "GROUP_STAGE" &&
            match.group === `Group ${letter}` &&
            match.status === "FINISHED" &&
            (match.homeTeam.name === name || match.awayTeam.name === name),
        ).length;
      });
      return playedCounts.every((count) => count >= 3);
    });

    const standing = groupLetter ? tables.get(groupLetter)?.get(teamName) : null;
    let groupPosition: number | null = null;
    if (standing && groupLetter) {
      const ranked = [...(tables.get(groupLetter)?.values() ?? [])].sort(
        (a, b) => {
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
        },
      );
      groupPosition =
        ranked.findIndex((row) => row.teamName === teamName) + 1 || null;
    }

    const score = calculateTeamScore(
      teamName,
      allMatches,
      groupPosition,
      groupComplete,
      data.scoring,
    ).total;

    const owner = data.draft[teamName];
    if (owner) {
      participantScores[owner] = (participantScores[owner] ?? 0) + score;
    }
  }

  return { participantScores, matches: allMatches };
}

export function countMatchStatus(fixtures: MatchSummary[]): {
  finished: number;
  remaining: number;
} {
  const playable = fixtures.filter(
    (fixture) =>
      fixture.homeTeam.name !== "TBD" && fixture.awayTeam.name !== "TBD",
  );
  const finished = playable.filter(
    (fixture) => fixture.status === "FINISHED",
  ).length;
  return {
    finished,
    remaining: playable.length - finished,
  };
}
