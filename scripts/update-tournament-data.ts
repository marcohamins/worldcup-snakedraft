import fs from "fs";
import path from "path";

import { calculateTeamScore, hasKnockoutInvolvement } from "../src/lib/scoring";
import { calculateTeamMatchStats } from "../src/lib/stats";
import type {
  DraftData,
  HistorySnapshot,
  MatchSummary,
  ScoringRules,
  StandingsData,
  TeamData,
  TeamsData,
} from "../src/lib/types";
import {
  createFootballDataProvider,
  type ApiMatch,
  type ApiStandingsGroup,
  type ApiTeam,
} from "./providers/football-data";

const dataDir = path.join(process.cwd(), "data");

function readJson<T>(filename: string): T {
  return JSON.parse(
    fs.readFileSync(path.join(dataDir, filename), "utf-8"),
  ) as T;
}

function writeJson(filename: string, data: unknown): void {
  fs.writeFileSync(
    path.join(dataDir, filename),
    `${JSON.stringify(data, null, 2)}\n`,
  );
}

function normalizeGroup(group: string | null): string | null {
  if (!group) {
    return null;
  }
  return group.replace("GROUP_", "Group ");
}

function mapWinner(
  winner: ApiMatch["score"]["winner"],
): MatchSummary["winner"] {
  if (winner === "HOME_TEAM") {
    return "HOME";
  }
  if (winner === "AWAY_TEAM") {
    return "AWAY";
  }
  if (winner === "DRAW") {
    return "DRAW";
  }
  return null;
}

function toMatchSummary(match: ApiMatch): MatchSummary {
  return {
    id: match.id,
    utcDate: match.utcDate,
    status: match.status,
    stage: match.stage,
    group: normalizeGroup(match.group),
    matchday: match.matchday,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    homeScore: match.score.fullTime.home,
    awayScore: match.score.fullTime.away,
    winner: mapWinner(match.score.winner),
    bookings: (match.bookings ?? []).map((booking) => ({
      team: booking.team,
      card: booking.card,
    })),
  };
}

function isGroupComplete(
  groupName: string | null,
  standings: ApiStandingsGroup[],
  matches: ApiMatch[],
): boolean {
  if (!groupName) {
    return false;
  }

  const apiGroup = `GROUP_${groupName.replace("Group ", "")}`;
  const groupMatches = matches.filter(
    (match) => match.group === apiGroup && match.stage === "GROUP_STAGE",
  );

  if (groupMatches.length === 0) {
    return false;
  }

  return groupMatches.every((match) => match.status === "FINISHED");
}

function getGroupPosition(
  teamName: string,
  groupName: string | null,
  standings: ApiStandingsGroup[],
): number | null {
  if (!groupName) {
    return null;
  }

  const standing = standings.find((entry) => entry.group === groupName);
  const row = standing?.table.find((item) => item.team.name === teamName);
  return row?.position ?? null;
}

function getGroupRecord(
  teamName: string,
  groupName: string | null,
  standings: ApiStandingsGroup[],
): TeamData["groupRecord"] {
  if (!groupName) {
    return { wins: 0, draws: 0, losses: 0 };
  }

  const standing = standings.find((entry) => entry.group === groupName);
  const row = standing?.table.find((item) => item.team.name === teamName);

  return {
    wins: row?.won ?? 0,
    draws: row?.draw ?? 0,
    losses: row?.lost ?? 0,
  };
}

function getKnockoutStage(
  teamName: string,
  matches: MatchSummary[],
): string | null {
  const knockoutMatches = matches
    .filter(
      (match) =>
        match.stage !== "GROUP_STAGE" &&
        (match.homeTeam.name === teamName || match.awayTeam.name === teamName),
    )
    .sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    );

  const latest = knockoutMatches.at(-1);
  if (!latest) {
    return null;
  }

  if (latest.status !== "FINISHED") {
    return formatStage(latest.stage);
  }

  const isHome = latest.homeTeam.name === teamName;
  const teamWon =
    (isHome && latest.winner === "HOME") ||
    (!isHome && latest.winner === "AWAY");

  return teamWon ? formatStage(latest.stage) : formatStage(latest.stage);
}

function formatStage(stage: string): string {
  return stage
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isTeamEliminated(
  teamName: string,
  groupName: string | null,
  groupComplete: boolean,
  groupPosition: number | null,
  matches: MatchSummary[],
): boolean {
  const knockoutMatches = matches.filter(
    (match) =>
      match.stage !== "GROUP_STAGE" &&
      match.status === "FINISHED" &&
      (match.homeTeam.name === teamName || match.awayTeam.name === teamName),
  );

  for (const match of knockoutMatches) {
    const isHome = match.homeTeam.name === teamName;
    const teamLost =
      (isHome && match.winner === "AWAY") ||
      (!isHome && match.winner === "HOME");
    if (teamLost) {
      return true;
    }
  }

  if (groupComplete && groupPosition === 4) {
    return true;
  }

  if (
    groupComplete &&
    groupPosition === 3 &&
    !hasKnockoutInvolvement(teamName, matches)
  ) {
    return true;
  }

  return false;
}

function buildTeamData(
  team: ApiTeam,
  draft: DraftData,
  allMatches: MatchSummary[],
  standings: ApiStandingsGroup[],
  rawMatches: ApiMatch[],
  scoring: ScoringRules,
): TeamData {
  const standingGroup = standings.find((entry) =>
    entry.table.some((row) => row.team.name === team.name),
  );
  const groupName = standingGroup?.group ?? null;
  const groupComplete = isGroupComplete(groupName, standings, rawMatches);
  const groupPosition = getGroupPosition(team.name, groupName, standings);
  const teamMatches = allMatches.filter(
    (match) =>
      match.homeTeam.name === team.name || match.awayTeam.name === team.name,
  );
  const playedMatches = teamMatches.filter(
    (match) => match.status === "FINISHED",
  );
  const upcomingMatch =
    teamMatches
      .filter((match) => match.status === "TIMED" || match.status === "SCHEDULED")
      .sort(
        (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
      )[0] ?? null;

  const scoreBreakdown = calculateTeamScore(
    team.name,
    allMatches,
    groupPosition,
    groupComplete,
    scoring,
  );

  const eliminated = isTeamEliminated(
    team.name,
    groupName,
    groupComplete,
    groupPosition,
    allMatches,
  );

  const inKnockout = hasKnockoutInvolvement(team.name, allMatches);

  const remaining =
    !eliminated &&
    (!groupComplete ||
      (groupPosition !== null && groupPosition <= 2) ||
      (groupPosition === 3 && inKnockout) ||
      inKnockout);

  const matchStats = calculateTeamMatchStats(team.name, teamMatches);

  return {
    id: team.id,
    name: team.name,
    shortName: team.shortName,
    tla: team.tla,
    crest: team.crest,
    owner: draft[team.name] ?? null,
    group: groupName,
    groupRecord: getGroupRecord(team.name, groupName, standings),
    groupPosition,
    groupComplete,
    matchesPlayed: playedMatches.length,
    upcomingMatch,
    knockoutStage: getKnockoutStage(team.name, allMatches),
    eliminated,
    remaining,
    score: scoreBreakdown.total,
    scoreBreakdown,
    matchStats,
    matches: teamMatches,
  };
}

function appendHistory(
  participants: string[],
  teams: TeamData[],
  existing: HistorySnapshot[],
): HistorySnapshot[] {
  const snapshot: HistorySnapshot = {
    timestamp: new Date().toISOString(),
  };

  for (const participant of participants) {
    snapshot[participant] = teams
      .filter((team) => team.owner === participant)
      .reduce((sum, team) => sum + team.score, 0);
  }

  const last = existing.at(-1);
  const unchanged =
    last &&
    participants.every((participant) => last[participant] === snapshot[participant]);

  if (unchanged) {
    return existing;
  }

  return [...existing, snapshot];
}

async function main(): Promise<void> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY is required");
  }

  const provider = createFootballDataProvider(apiKey);
  const [competition, rawMatches, standings, apiTeams] = await Promise.all([
    provider.fetchCompetition(),
    provider.fetchMatches(),
    provider.fetchStandings(),
    provider.fetchTeams(),
  ]);

  const draft = readJson<DraftData>("draft.json");
  const scoring = readJson<ScoringRules>("scoring.json");
  const participants = readJson<{ participants: string[] }>(
    "participants.json",
  ).participants;
  const history = readJson<HistorySnapshot[]>("history.json");

  const matches = rawMatches.map(toMatchSummary);
  const draftedTeamNames = new Set(Object.keys(draft));
  const teamsToProcess = apiTeams.filter((team) => draftedTeamNames.has(team.name));

  const teams = teamsToProcess.map((team) =>
    buildTeamData(team, draft, matches, standings, rawMatches, scoring),
  );

  const teamsData: TeamsData = {
    lastUpdated: new Date().toISOString(),
    competition,
    teams,
  };

  const standingsData: StandingsData = {
    lastUpdated: new Date().toISOString(),
    groups: standings.map((group) => ({
      group: group.group,
      table: group.table.map((row) => ({
        position: row.position,
        team: row.team,
        playedGames: row.playedGames,
        won: row.won,
        draw: row.draw,
        lost: row.lost,
        points: row.points,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        goalDifference: row.goalDifference,
      })),
    })),
  };

  const updatedHistory = appendHistory(participants, teams, history);

  writeJson("teams.json", teamsData);
  writeJson("standings.json", standingsData);
  writeJson("history.json", updatedHistory);

  console.log(`Updated ${teams.length} drafted teams at ${teamsData.lastUpdated}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
