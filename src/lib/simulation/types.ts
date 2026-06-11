import type { MatchSummary, ScoringRules, TeamData } from "../types";
import type { SimBaseline } from "./baseline";
import type { StageCheckpoint } from "./stages";

export interface SimConfig {
  ratingScale: number;
  drawBase: number;
  drawScale: number;
  defaultSimCount: number;
}

export interface TeamMeta {
  name: string;
  tla: string;
  group: string | null;
  id: number;
}

/** Two-element slot from bracket JSON: [kind, groupOrSlotIndex] */
export type BracketSlotRaw = readonly [string, string | number];

export interface BracketSlot {
  kind: "1" | "2" | "3";
  ref: string | number;
}

export interface BracketStructure {
  groupLetters: string[];
  thirdSlotEligible: string[][];
  roundOf32: { match: number; home: BracketSlotRaw; away: BracketSlotRaw }[];
  roundOf16: { match: number; feederA: number; feederB: number }[];
  quarterFinals: { match: number; feederA: number; feederB: number }[];
  semiFinals: { match: number; feederA: number; feederB: number }[];
  thirdPlace: { match: number; feederA: number; feederB: number };
  final: { match: number; feederA: number; feederB: number };
}

export interface BracketMatrix {
  structure: BracketStructure;
  combinations: Record<string, string[]>;
}

export interface FixturesData {
  lastUpdated: string;
  fixtures: MatchSummary[];
}

export interface ResolvedMatch {
  homeScore: number;
  awayScore: number;
  winner: "HOME" | "AWAY" | "DRAW";
}

export interface GroupTableRow {
  teamName: string;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  peleRating: number;
}

export interface SimulationData {
  fixtures: MatchSummary[];
  teams: TeamData[];
  teamsMeta: Record<string, TeamMeta>;
  peleRatings: Record<string, number>;
  peleOverrides: Record<string, string>;
  bracketMatrix: BracketMatrix;
  simConfig: SimConfig;
  scoring: ScoringRules;
  draft: Record<string, string>;
  participants: string[];
  baseline: SimBaseline;
}

export interface ParticipantProjection {
  participant: string;
  mean: number;
  median: number;
  p10: number;
  p90: number;
  winProbability: number;
  scores: number[];
}

export interface MonteCarloResult {
  iterations: number;
  finishedMatches: number;
  remainingMatches: number;
  totalMatches: number;
  anchorResults: boolean;
  projections: ParticipantProjection[];
  histogramBins: { participant: string; bins: { score: number; count: number }[] }[];
  stageMedians: Partial<Record<StageCheckpoint, Record<string, number>>>;
}
