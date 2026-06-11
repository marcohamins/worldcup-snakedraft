import type { DraftData, TeamData } from "./types";

export function getOwnedTeams(
  participant: string,
  teams: TeamData[],
  draft: DraftData,
): TeamData[] {
  const teamByName = Object.fromEntries(teams.map((team) => [team.name, team]));
  return Object.entries(draft)
    .filter(([, owner]) => owner === participant)
    .map(([teamName]) => teamByName[teamName])
    .filter((team): team is TeamData => team !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
}
