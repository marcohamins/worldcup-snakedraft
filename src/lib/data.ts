import fs from "fs";
import path from "path";

import { calculateLeaderboard } from "./scoring";
import type {
  DraftData,
  HistorySnapshot,
  LeaderboardEntry,
  ScoringRules,
  StandingsData,
  TeamsData,
} from "./types";

const dataDir = path.join(process.cwd(), "data");

function readJson<T>(filename: string): T {
  const filePath = path.join(dataDir, filename);
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
}

export function getScoringRules(): ScoringRules {
  return readJson<ScoringRules>("scoring.json");
}

export function getParticipants(): string[] {
  return readJson<{ participants: string[] }>("participants.json").participants;
}

export function getDraft(): DraftData {
  return readJson<DraftData>("draft.json");
}

export function getTeamsData(): TeamsData {
  return readJson<TeamsData>("teams.json");
}

export function getStandingsData(): StandingsData {
  return readJson<StandingsData>("standings.json");
}

export function getHistory(): HistorySnapshot[] {
  return readJson<HistorySnapshot[]>("history.json");
}

export function getLeaderboard(): LeaderboardEntry[] {
  const participants = getParticipants();
  const teams = getTeamsData().teams;
  const draft = getDraft();
  return calculateLeaderboard(participants, teams, draft);
}

export { teamNameToSlug, slugToTeamName } from "./teams";
