import type { MatchSummary } from "./types";

/** Tournament matchday for knockout rounds (group uses API matchday 1–3). */
export const KNOCKOUT_MATCHDAY: Record<string, number> = {
  LAST_32: 4,
  LAST_16: 5,
  QUARTER_FINALS: 6,
  SEMI_FINALS: 7,
  THIRD_PLACE: 8,
  FINAL: 8,
};

export const PHASE_BOUNDARIES: { x: number; label: string }[] = [
  { x: 3.5, label: "End of group stage" },
  { x: 4.5, label: "End of Round of 32" },
  { x: 5.5, label: "End of Round of 16" },
  { x: 6.5, label: "End of Quarter-finals" },
  { x: 7.5, label: "End of Semi-finals" },
];

export function isMatchResolved(match: MatchSummary): boolean {
  return (
    match.status === "FINISHED" &&
    match.homeScore !== null &&
    match.awayScore !== null &&
    match.winner !== null
  );
}

export function getTournamentMatchday(match: MatchSummary): number | null {
  if (match.stage === "GROUP_STAGE") {
    return match.matchday;
  }
  return KNOCKOUT_MATCHDAY[match.stage] ?? null;
}

/** Highest tournament matchday with at least one resolved result. */
export function getCurrentSnapshotMatchday(matches: MatchSummary[]): number {
  let max = 0;
  for (const match of matches) {
    if (!isMatchResolved(match)) {
      continue;
    }
    const md = getTournamentMatchday(match);
    if (md !== null && md > max) {
      max = md;
    }
  }
  return max;
}

export function formatMatchdayLabel(matchday: number): string {
  if (matchday === 0) {
    return "Pre-tournament";
  }
  return `MD ${matchday}`;
}

export function visiblePhaseBoundaries(
  minMatchday: number,
  maxMatchday: number,
): { x: number; label: string }[] {
  return PHASE_BOUNDARIES.filter(
    (boundary) => boundary.x > minMatchday && boundary.x < maxMatchday + 1,
  );
}
