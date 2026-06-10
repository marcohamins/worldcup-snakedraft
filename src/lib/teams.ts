export function teamNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugToTeamName(
  slug: string,
  teamNames: string[],
): string | null {
  return teamNames.find((name) => teamNameToSlug(name) === slug) ?? null;
}
