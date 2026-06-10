import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ScoreTrajectoryChart } from "@/components/charts/ScoreTrajectoryChart";
import { StandingsBarChart } from "@/components/charts/StandingsBarChart";
import { TeamContributionChart } from "@/components/charts/TeamContributionChart";
import {
  getHistory,
  getLeaderboard,
  getParticipants,
  getTeamsData,
} from "@/lib/data";

export default function HomePage() {
  const leaderboard = getLeaderboard();
  const history = getHistory();
  const participants = getParticipants();
  const teamsData = getTeamsData();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-gold/20 bg-navy-light/70 p-6 shadow-2xl shadow-black/30">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              Live Standings
            </p>
            <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
          </div>
          <p className="text-sm text-white/60">
            Last updated{" "}
            {new Date(teamsData.lastUpdated).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <LeaderboardTable entries={leaderboard} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-navy-light/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Current Standings
          </h3>
          <StandingsBarChart entries={leaderboard} />
        </div>
        <div className="rounded-3xl border border-white/10 bg-navy-light/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Score Trajectory
          </h3>
          <ScoreTrajectoryChart history={history} participants={participants} />
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Points by Team
        </h3>
        <TeamContributionChart entries={leaderboard} />
      </section>
    </div>
  );
}
