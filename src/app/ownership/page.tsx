import Image from "next/image";
import Link from "next/link";

import { getDraft, getParticipants, getTeamsData } from "@/lib/data";
import { teamNameToSlug } from "@/lib/teams";

export default function OwnershipPage() {
  const participants = getParticipants();
  const draft = getDraft();
  const teamsData = getTeamsData();
  const teamByName = Object.fromEntries(
    teamsData.teams.map((team) => [team.name, team]),
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          Draft Board
        </p>
        <h2 className="text-3xl font-bold text-white">Team Ownership</h2>
        <p className="mt-2 text-white/60">
          8 participants · 4 teams each · snake draft order
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {participants.map((participant) => {
          const ownedTeams = Object.entries(draft)
            .filter(([, owner]) => owner === participant)
            .map(([teamName]) => teamName)
            .sort((a, b) => a.localeCompare(b));

          const totalScore = ownedTeams.reduce(
            (sum, teamName) => sum + (teamByName[teamName]?.score ?? 0),
            0,
          );

          return (
            <section
              key={participant}
              className="rounded-3xl border border-white/10 bg-navy-light/70 p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{participant}</h3>
                <span className="rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
                  {totalScore} pts
                </span>
              </div>
              <ul className="space-y-3">
                {ownedTeams.map((teamName) => {
                  const team = teamByName[teamName];
                  return (
                    <li key={teamName}>
                      <Link
                        href={`/teams/${teamNameToSlug(teamName)}/`}
                        className="flex items-center gap-3 rounded-2xl border border-white/5 bg-black/20 px-3 py-2 transition hover:border-gold/30 hover:bg-gold/5"
                      >
                        {team?.crest ? (
                          <Image
                            src={team.crest}
                            alt=""
                            width={28}
                            height={28}
                            className="h-7 w-7 object-contain"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-white/10" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white">{teamName}</p>
                          <p className="text-xs text-white/50">
                            {team?.remaining ? "Still alive" : "Eliminated"} ·{" "}
                            {team?.score ?? 0} pts
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
