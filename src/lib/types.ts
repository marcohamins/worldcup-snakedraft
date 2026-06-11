export interface ScoringRules {
  group_win: number;
  group_draw: number;
  group_first_place: number;
  group_second_place: number;
  group_third_place_advance: number;
  round_of_32_win: number;
  round_of_16_win: number;
  quarterfinal_win: number;
  semifinal_win: number;
  final_win: number;
  third_place_win: number;
}

export interface TeamInfo {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export interface MatchBooking {
  team: TeamInfo;
  card: "YELLOW" | "YELLOW_RED" | "RED";
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
  bookings: MatchBooking[];
}

export interface ScoreBreakdown {
  groupWins: number;
  groupDraws: number;
  groupFirstPlaceBonus: number;
  groupSecondPlaceBonus: number;
  groupThirdPlaceAdvanceBonus: number;
  knockoutWins: Record<string, number>;
  total: number;
}

export interface TeamMatchStats {
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  yellowCards: number;
  redCards: number;
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
  matchStats: TeamMatchStats;
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
  matchday: number;
  [participant: string]: string | number;
}

export interface OwnedTeamSummary {
  name: string;
  crest: string;
  remaining: boolean;
  score: number;
}

export interface LeaderboardEntry {
  rank: number;
  participant: string;
  totalScore: number;
  teamsRemaining: number;
  pointsBehindLeader: number;
  ownedTeams: OwnedTeamSummary[];
  bestTeam: { name: string; score: number } | null;
  worstTeam: { name: string; score: number } | null;
  teamScores: Record<string, number>;
}

export interface ParticipantPoolStats {
  participant: string;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  yellowCards: number;
  redCards: number;
  totalCards: number;
}
