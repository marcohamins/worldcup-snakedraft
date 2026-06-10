import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getTeamsData } from "@/lib/data";
import { slugToTeamName, teamNameToSlug } from "@/lib/teams";

export function generateStaticParams() {
  const teamsData = getTeamsData();
  return teamsData.teams.map((team) => ({
    slug: teamNameToSlug(team.name),
  }));
}

function formatMatch(match: {
  homeTeam: { name: string; crest: string };
  awayTeam: { name: string; crest: string };
  homeScore: number | null;
  awayScore: number | null;
  utcDate: string;
  status: string;
}) {
  const score =
    match.homeScore !== null && match.awayScore !== null
      ? `${match.homeScore}–${match.awayScore}`
      : "vs";

  return {
    label: `${match.homeTeam.name} ${score} ${match.awayTeam.name}`,
    date: new Date(match.utcDate).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    status: match.status,
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const teamsData = getTeamsData();
  const teamName = slugToTeamName(
    slug,
    teamsData.teams.map((team) => team.name),
  );

  if (!teamName) {
    notFound();
  }

  const team = teamsData.teams.find((entry) => entry.name === teamName);
  if (!team) {
    notFound();
  }

  const playedMatches = team.matches
    .filter((match) => match.status === "FINISHED")
    .sort(
      (a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime(),
    );

  return (
    <div className="space-y-8">
      <Link
        href="/ownership/"
        className="text-sm text-gold hover:underline"
      >
        ← Back to ownership
      </Link>

      <section className="rounded-3xl border border-gold/20 bg-navy-light/70 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Image
            src={team.crest}
            alt=""
            width={72}
            height={72}
            className="h-18 w-18 object-contain"
          />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-gold">
              {team.owner ?? "Unassigned"}
            </p>
            <h2 className="text-3xl font-bold text-white">{team.name}</h2>
            <p className="text-white/60">
              {team.group ?? "Group TBD"} · {team.remaining ? "Alive" : "Out"}
            </p>
          </div>
          <div className="sm:ml-auto sm:text-right">
            <p className="text-sm text-white/50">Current score</p>
            <p className="text-4xl font-bold text-gold">{team.score}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-5">
          <h3 className="mb-4 font-semibold text-white">Group Stage</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Record</dt>
              <dd className="font-medium text-white">
                {team.groupRecord.wins}-{team.groupRecord.draws}-
                {team.groupRecord.losses}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Group position</dt>
              <dd className="font-medium text-white">
                {team.groupPosition ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Matches played</dt>
              <dd className="font-medium text-white">{team.matchesPlayed}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-5">
          <h3 className="mb-4 font-semibold text-white">Knockout</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/60">Progress</dt>
              <dd className="font-medium text-white">
                {team.knockoutStage ?? "Not started"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/60">Upcoming</dt>
              <dd className="max-w-[16rem] text-right font-medium text-white">
                {team.upcomingMatch
                  ? formatMatch(team.upcomingMatch).label
                  : "None scheduled"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-5">
        <h3 className="mb-4 font-semibold text-white">Score Breakdown</h3>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex justify-between rounded-xl bg-black/20 px-4 py-3">
            <dt className="text-white/60">Group wins</dt>
            <dd className="text-white">
              {team.scoreBreakdown.groupWins} × pts
            </dd>
          </div>
          <div className="flex justify-between rounded-xl bg-black/20 px-4 py-3">
            <dt className="text-white/60">Group draws</dt>
            <dd className="text-white">
              {team.scoreBreakdown.groupDraws} × pts
            </dd>
          </div>
          <div className="flex justify-between rounded-xl bg-black/20 px-4 py-3">
            <dt className="text-white/60">1st in group</dt>
            <dd className="text-white">
              {team.scoreBreakdown.groupFirstPlaceBonus}
            </dd>
          </div>
          <div className="flex justify-between rounded-xl bg-black/20 px-4 py-3">
            <dt className="text-white/60">2nd in group</dt>
            <dd className="text-white">
              {team.scoreBreakdown.groupSecondPlaceBonus}
            </dd>
          </div>
          <div className="flex justify-between rounded-xl bg-black/20 px-4 py-3">
            <dt className="text-white/60">3rd place advance</dt>
            <dd className="text-white">
              {team.scoreBreakdown.groupThirdPlaceAdvanceBonus}
            </dd>
          </div>
          {Object.entries(team.scoreBreakdown.knockoutWins).map(
            ([stage, points]) => (
              <div
                key={stage}
                className="flex justify-between rounded-xl bg-black/20 px-4 py-3"
              >
                <dt className="text-white/60">{stage}</dt>
                <dd className="text-white">{points}</dd>
              </div>
            ),
          )}
        </dl>
      </section>

      <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-5">
        <h3 className="mb-4 font-semibold text-white">Recent Matches</h3>
        {playedMatches.length === 0 ? (
          <p className="text-sm text-white/60">No completed matches yet.</p>
        ) : (
          <ul className="space-y-3">
            {playedMatches.map((match) => {
              const formatted = formatMatch(match);
              return (
                <li
                  key={match.id}
                  className="flex flex-col gap-1 rounded-xl border border-white/5 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-white">{formatted.label}</span>
                  <span className="text-xs text-white/50">{formatted.date}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
