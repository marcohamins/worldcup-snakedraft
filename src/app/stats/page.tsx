import { PoolStatsTable } from "@/components/PoolStatsTable";
import { getParticipants, getTeamsData } from "@/lib/data";
import { calculateParticipantPoolStats } from "@/lib/stats";

function topBy<T extends { participant: string }>(
  items: T[],
  key: keyof T,
): T | null {
  if (items.length === 0) {
    return null;
  }
  return [...items].sort(
    (a, b) => Number(b[key]) - Number(a[key]),
  )[0];
}

export default function StatsPage() {
  const participants = getParticipants();
  const teamsData = getTeamsData();
  const poolStats = calculateParticipantPoolStats(
    participants,
    teamsData.teams,
  );

  const topScorer = topBy(poolStats, "goalsFor");
  const bestDefense = [...poolStats].sort(
    (a, b) => a.goalsAgainst - b.goalsAgainst,
  )[0];
  const bestGd = topBy(poolStats, "goalDifference");
  const mostCards = topBy(poolStats, "totalCards");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          The Fun Stuff
        </p>
        <h2 className="text-3xl font-bold text-white">Pool Stats</h2>
        <p className="mt-2 text-white/60">
          Goals and discipline across all drafted teams — click column headers to
          sort.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topScorer && (
          <div className="rounded-2xl border border-emerald/30 bg-emerald/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald">
              Most Goals Scored
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {topScorer.participant}
            </p>
            <p className="text-2xl font-bold text-gold">{topScorer.goalsFor}</p>
          </div>
        )}
        {bestDefense && (
          <div className="rounded-2xl border border-accent-blue/30 bg-accent-blue/10 p-4">
            <p className="text-xs uppercase tracking-wide text-accent-blue">
              Fewest Goals Conceded
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {bestDefense.participant}
            </p>
            <p className="text-2xl font-bold text-gold">
              {bestDefense.goalsAgainst}
            </p>
          </div>
        )}
        {bestGd && (
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4">
            <p className="text-xs uppercase tracking-wide text-gold">
              Best Goal Difference
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {bestGd.participant}
            </p>
            <p className="text-2xl font-bold text-gold">
              {bestGd.goalDifference > 0 ? "+" : ""}
              {bestGd.goalDifference}
            </p>
          </div>
        )}
        {mostCards && mostCards.totalCards > 0 && (
          <div className="rounded-2xl border border-accent-red/30 bg-accent-red/10 p-4">
            <p className="text-xs uppercase tracking-wide text-accent-red">
              Most Cards
            </p>
            <p className="mt-1 text-xl font-bold text-white">
              {mostCards.participant}
            </p>
            <p className="text-sm text-white/70">
              {mostCards.yellowCards}Y · {mostCards.redCards}R
            </p>
          </div>
        )}
      </div>

      <PoolStatsTable stats={poolStats} />
    </div>
  );
}
