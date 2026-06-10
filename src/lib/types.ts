export interface ScoringRules {
  group_win: number;
  group_draw: number;
  group_winner_bonus: number;
  round_of_32_win: number;
  round_of_16_win: number;
  quarterfinal_win: number;
  semifinal_win: number;
  final_win: number;
  include_third_place: boolean;
}

export interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface MatchSummary {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  matchday: number | null;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore: number | null;
  awayScore: number | null;
  winner: "HOME" | "AWAY" | "DRAW" | null;
}

export interface ScoreBreakdown {
  groupWins: number;
  groupDraws: number;
  groupWinnerBonus: number;
  knockoutWins: Record<string, number>;
  total: number;
}

export interface TeamData {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  owner: string | null;
  group: string | null;
  groupRecord: { wins: number; draws: number; losses: number };
  groupPosition: number | null;
  groupComplete: boolean;
  matchesPlayed: number;
  upcomingMatch: MatchSummary | null;
  knockoutStage: string | null;
  eliminated: boolean;
  remaining: boolean;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  matches: MatchSummary[];
}

export interface GroupStandingRow {
  position: number;
  team: TeamInfo;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface GroupStanding {
  group: string;
  table: GroupStandingRow[];
}

export interface StandingsData {
  lastUpdated: string;
  groups: GroupStanding[];
}

export interface TeamsData {
  lastUpdated: string;
  competition: {
    name: string;
    code: string;
    emblem: string;
    seasonStart: string;
    seasonEnd: string;
  };
  teams: TeamData[];
}

export type DraftData = Record<string, string>;

export interface HistorySnapshot {
  timestamp: string;
  [participant: string]: string | number;
}

export interface LeaderboardEntry {
  rank: number;
  participant: string;
  totalScore: number;
  teamsRemaining: number;
  pointsBehindLeader: number;
  bestTeam: { name: string; score: number } | null;
  teamScores: Record<string, number>;
}

export interface ParticipantContribution {
  participant: string;
  teams: { name: string; score: number }[];
}
