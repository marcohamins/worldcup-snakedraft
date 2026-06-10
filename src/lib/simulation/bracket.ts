import type { BracketMatrix, BracketSlot, BracketSlotRaw } from "./types";

export function parseBracketSlot(raw: BracketSlotRaw): BracketSlot {
  return {
    kind: raw[0] as BracketSlot["kind"],
    ref: raw[1],
  };
}

export function resolveThirdPlaceSlots(
  qualifyingGroups: string[],
  bracketMatrix: BracketMatrix,
): string[] {
  const key = [...qualifyingGroups].sort().join("");
  const assignment = bracketMatrix.combinations[key];
  if (!assignment) {
    throw new Error(`Missing bracket combination for ${key}`);
  }
  return assignment;
}

export function resolveBracketTeam(
  slot: BracketSlot,
  first: Map<string, string>,
  second: Map<string, string>,
  thirdBySlot: string[],
  thirdTeams: Map<string, string>,
): string {
  if (slot.kind === "1") {
    return first.get(slot.ref as string) ?? "TBD";
  }
  if (slot.kind === "2") {
    return second.get(slot.ref as string) ?? "TBD";
  }
  const groupLetter = thirdBySlot[slot.ref as number];
  return thirdTeams.get(groupLetter ?? "") ?? "TBD";
}

export function buildRoundOf32Pairings(
  bracketMatrix: BracketMatrix,
  first: Map<string, string>,
  second: Map<string, string>,
  thirdTeams: Map<string, string>,
  qualifyingGroups: string[],
): { matchNumber: number; home: string; away: string }[] {
  const thirdBySlot = resolveThirdPlaceSlots(qualifyingGroups, bracketMatrix);

  return bracketMatrix.structure.roundOf32.map((fixture) => ({
    matchNumber: fixture.match,
    home: resolveBracketTeam(
      parseBracketSlot(fixture.home),
      first,
      second,
      thirdBySlot,
      thirdTeams,
    ),
    away: resolveBracketTeam(
      parseBracketSlot(fixture.away),
      first,
      second,
      thirdBySlot,
      thirdTeams,
    ),
  }));
}
