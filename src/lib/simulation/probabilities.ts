import type { SimConfig } from "./types";

export interface MatchProbabilities {
  pHomeWin: number;
  pDraw: number;
  pAwayWin: number;
}

export function getMatchProbabilities(
  homeRating: number,
  awayRating: number,
  config: SimConfig,
  knockout: boolean,
): MatchProbabilities {
  const ratingDiff = homeRating - awayRating;
  const expectedScore =
    1 / (1 + 10 ** (-ratingDiff / config.ratingScale));

  if (knockout) {
    return {
      pHomeWin: expectedScore,
      pDraw: 0,
      pAwayWin: 1 - expectedScore,
    };
  }

  const pDraw = config.drawBase * Math.exp(-Math.abs(ratingDiff) / config.drawScale);
  let pHomeWin = expectedScore - 0.5 * pDraw;
  pHomeWin = Math.max(0, Math.min(1 - pDraw, pHomeWin));
  const pAwayWin = 1 - pDraw - pHomeWin;

  return { pHomeWin, pDraw, pAwayWin };
}

export function sampleWinner(
  probabilities: MatchProbabilities,
  random: number,
  knockout: boolean,
): "HOME" | "AWAY" | "DRAW" {
  if (knockout) {
    return random < probabilities.pHomeWin ? "HOME" : "AWAY";
  }

  if (random < probabilities.pHomeWin) {
    return "HOME";
  }
  if (random < probabilities.pHomeWin + probabilities.pDraw) {
    return "DRAW";
  }
  return "AWAY";
}

export function scoresFromWinner(
  winner: "HOME" | "AWAY" | "DRAW",
): { homeScore: number; awayScore: number } {
  if (winner === "HOME") {
    return { homeScore: 1, awayScore: 0 };
  }
  if (winner === "AWAY") {
    return { homeScore: 0, awayScore: 1 };
  }
  return { homeScore: 1, awayScore: 1 };
}
