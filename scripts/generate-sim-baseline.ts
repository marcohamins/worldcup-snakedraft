import fs from "fs";
import path from "path";

import bracketMatrix from "../data/bracket-matrix.json";
import draft from "../data/draft.json";
import fixturesData from "../data/fixtures.json";
import participantsData from "../data/participants.json";
import peleOverrides from "../data/pele-overrides.json";
import peleRatings from "../data/pele-ratings.json";
import scoring from "../data/scoring.json";
import simConfig from "../data/sim-config.json";
import teamsData from "../data/teams.json";
import teamsMeta from "../data/teams-meta.json";

import type { ScoringRules, TeamData } from "../src/lib/types";
import { runMonteCarlo } from "../src/lib/simulation/monte-carlo";
import { STAGE_CHECKPOINTS } from "../src/lib/simulation/stages";
import type {
  BracketMatrix,
  SimConfig,
  SimulationData,
  TeamMeta,
} from "../src/lib/simulation/types";

const dataDir = path.join(process.cwd(), "data");
const iterations = 2000;

const data: SimulationData = {
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
  baseline: {
    generatedAt: "",
    iterations: 0,
    stageMedians: {},
    finalMedians: {},
  },
};

const result = runMonteCarlo(data, iterations, { anchorResults: false });

const finalMedians = Object.fromEntries(
  data.participants.map((participant) => {
    const projection = result.projections.find(
      (entry) => entry.participant === participant,
    );
    return [participant, projection?.median ?? 0];
  }),
);

const baseline = {
  generatedAt: new Date().toISOString(),
  iterations,
  stageMedians: result.stageMedians,
  finalMedians,
};

fs.writeFileSync(
  path.join(dataDir, "sim-baseline.json"),
  `${JSON.stringify(baseline, null, 2)}\n`,
);

console.log(
  `Generated sim-baseline.json (${iterations} iterations, ${STAGE_CHECKPOINTS.length} stages)`,
);
