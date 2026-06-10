import fs from "fs";
import path from "path";

import { createFootballDataProvider } from "./providers/football-data";

const dataDir = path.join(process.cwd(), "data");

function normalizeGroup(group: string | null): string | null {
  if (!group) {
    return null;
  }
  return group.replace("GROUP_", "Group ");
}

function mapWinner(
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null,
): "HOME" | "AWAY" | "DRAW" | null {
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

async function main(): Promise<void> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY is required");
  }

  const provider = createFootballDataProvider(apiKey);
  const [matches, standings, teams] = await Promise.all([
    provider.fetchMatches(),
    provider.fetchStandings(),
    provider.fetchTeams(),
  ]);

  const groupByTeam = new Map<string, string>();
  for (const group of standings) {
    const letter = group.group.replace("Group ", "");
    for (const row of group.table) {
      groupByTeam.set(row.team.name, letter);
    }
  }

  const fixtures = matches
    .map((match) => ({
      id: match.id,
      utcDate: match.utcDate,
      status: match.status,
      stage: match.stage,
      group: normalizeGroup(match.group),
      matchday: match.matchday,
      homeTeam: match.homeTeam.name
        ? match.homeTeam
        : {
            id: 0,
            name: "TBD",
            shortName: "TBD",
            tla: "TBD",
            crest: "",
          },
      awayTeam: match.awayTeam.name
        ? match.awayTeam
        : {
            id: 0,
            name: "TBD",
            shortName: "TBD",
            tla: "TBD",
            crest: "",
          },
      homeScore: match.score.fullTime.home,
      awayScore: match.score.fullTime.away,
      winner: mapWinner(match.score.winner),
      bookings: [],
    }))
    .sort(
      (a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime(),
    );

  const teamsMeta = Object.fromEntries(
    teams.map((team) => [
      team.name,
      {
        name: team.name,
        tla: team.tla,
        group: groupByTeam.get(team.name) ?? null,
        id: team.id,
      },
    ]),
  );

  fs.writeFileSync(
    path.join(dataDir, "fixtures.json"),
    `${JSON.stringify({ lastUpdated: new Date().toISOString(), fixtures }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(dataDir, "teams-meta.json"),
    `${JSON.stringify(teamsMeta, null, 2)}\n`,
  );

  console.log(`Wrote ${fixtures.length} fixtures and ${teams.length} teams`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
