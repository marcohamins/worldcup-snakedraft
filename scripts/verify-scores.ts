import draft from "../data/draft.json";
import scoring from "../data/scoring.json";
import teamsData from "../data/teams.json";
import { getParticipants } from "../src/lib/data";
import { isMatchResolved, normalizeMatchResult } from "../src/lib/matchdays";
import { calculateLeaderboard, calculateTeamScore } from "../src/lib/scoring";
import type { MatchSummary, TeamData } from "../src/lib/types";

function dedupeMatches(teams: TeamData[]): MatchSummary[] {
  const byId = new Map<number, MatchSummary>();
  for (const team of teams) {
    for (const match of team.matches) {
      byId.set(match.id, match);
    }
  }
  return [...byId.values()];
}

function main(): void {
  const teams = teamsData.teams;
  const rawMatches = dedupeMatches(teams);
  const matches = rawMatches.map(normalizeMatchResult);

  console.log(`Last updated: ${teamsData.lastUpdated}`);
  console.log(`Matches: ${matches.length} (${matches.filter((m) => m.stage === "GROUP_STAGE").length} group, ${matches.filter((m) => m.stage !== "GROUP_STAGE").length} knockout)`);

  const unresolvedFinished = rawMatches.filter(
    (match) =>
      match.status === "FINISHED" &&
      match.homeScore !== null &&
      match.awayScore !== null &&
      match.winner === null,
  );
  if (unresolvedFinished.length > 0) {
    console.log("\nUnresolved FINISHED matches (winner inferred on refresh):");
    for (const match of unresolvedFinished) {
      console.log(
        `  ${match.stage} ${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name}`,
      );
    }
  }

  const mismatches = teams.filter((team) => {
    const recomputed = calculateTeamScore(
      team.name,
      matches,
      team.groupPosition,
      team.groupComplete,
      scoring,
    );
    return recomputed.total !== team.score;
  });

  console.log(`\nScore mismatches: ${mismatches.length}`);
  for (const team of mismatches) {
    const recomputed = calculateTeamScore(
      team.name,
      matches,
      team.groupPosition,
      team.groupComplete,
      scoring,
    );
    console.log(
      `  ${team.name}: stored ${team.score}, expected ${recomputed.total}`,
    );
    console.log(`    stored: ${JSON.stringify(team.scoreBreakdown)}`);
    console.log(`    expected: ${JSON.stringify(recomputed)}`);
  }

  const koResolved = matches.filter(
    (match) => match.stage !== "GROUP_STAGE" && isMatchResolved(match),
  );
  console.log(`\nResolved knockout matches: ${koResolved.length}`);
  for (const match of koResolved) {
    const winner =
      match.winner === "HOME"
        ? match.homeTeam.name
        : match.winner === "AWAY"
          ? match.awayTeam.name
          : "draw";
    const team = teams.find(
      (entry) =>
        entry.name ===
        (match.winner === "HOME"
          ? match.homeTeam.name
          : match.winner === "AWAY"
            ? match.awayTeam.name
            : ""),
    );
    const koPts = team?.scoreBreakdown.knockoutWins[match.stage] ?? 0;
    console.log(
      `  ${match.stage} ${match.homeTeam.name} ${match.homeScore}-${match.awayScore} ${match.awayTeam.name} -> ${winner} (${koPts} pts in breakdown)`,
    );
  }

  const leaderboard = calculateLeaderboard(
    getParticipants(),
    teams,
    draft,
  );
  console.log("\nLeaderboard:");
  for (const entry of leaderboard) {
    console.log(`  ${entry.rank}. ${entry.participant}: ${entry.totalScore}`);
  }

  if (mismatches.length > 0) {
    process.exit(1);
  }
}

main();
