import type { StageCheckpoint } from "./stages";

export interface SimBaseline {
  capturedAt: string;
  iterations: number;
  /** Median expected points per participant at each stage checkpoint. */
  stageMedians: Record<StageCheckpoint, Record<string, number>>;
  /** Median expected final total per participant. */
  finalMedians: Record<string, number>;
}

const STORAGE_KEY = "worldcup-snakedraft-sim-baseline";

export function loadBaseline(): SimBaseline | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as SimBaseline;
  } catch {
    return null;
  }
}

export function saveBaseline(baseline: SimBaseline): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(baseline));
}

export function clearBaseline(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
}
