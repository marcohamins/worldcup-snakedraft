import simBaseline from "../../../data/sim-baseline.json";
import bracketMatrix from "../../../data/bracket-matrix.json";
import draft from "../../../data/draft.json";
import fixturesData from "../../../data/fixtures.json";
import participantsData from "../../../data/participants.json";
import peleOverrides from "../../../data/pele-overrides.json";
import peleRatings from "../../../data/pele-ratings.json";
import scoring from "../../../data/scoring.json";
import simConfig from "../../../data/sim-config.json";
import teamsData from "../../../data/teams.json";
import teamsMeta from "../../../data/teams-meta.json";

import type { ScoringRules, TeamData } from "../types";
import type { SimBaseline } from "./baseline";
import type {
  BracketMatrix,
  SimulationData,
  SimConfig,
  TeamMeta,
} from "./types";

export function loadSimulationData(): SimulationData {
  return {
    fixtures: fixturesData.fixtures,
    teams: teamsData.teams as TeamData[],
    teamsMeta: teamsMeta as Record<string, TeamMeta>,
    peleRatings: peleRatings as Record<string, number>,
    peleOverrides: peleOverrides as Record<string, string>,
    bracketMatrix: bracketMatrix as unknown as BracketMatrix,
    simConfig: simConfig as SimConfig,
    scoring: scoring as ScoringRules,
    draft: draft as Record<string, string>,
    participants: participantsData.participants,
    baseline: simBaseline as SimBaseline,
  };
}
