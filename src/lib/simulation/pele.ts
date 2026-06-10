import type { TeamMeta } from "./types";

export function buildRatingLookup(
  peleRatings: Record<string, number>,
  peleOverrides: Record<string, string>,
  teamsMeta: Record<string, TeamMeta>,
): Map<string, number> {
  const ratings = new Map<string, number>();
  const allPele = Object.values(peleRatings);
  const fallback =
    allPele.reduce((sum, value) => sum + value, 0) / (allPele.length || 1);

  for (const team of Object.values(teamsMeta)) {
    const peleCode = peleOverrides[team.tla] ?? team.tla;
    ratings.set(team.name, peleRatings[peleCode] ?? fallback);
  }

  return ratings;
}
