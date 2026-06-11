import Image from "next/image";
import Link from "next/link";

import { teamNameToSlug } from "@/lib/teams";
import type { OwnedTeamSummary } from "@/lib/types";

interface TeamFlagsProps {
  teams: OwnedTeamSummary[];
}

export function TeamFlags({ teams }: TeamFlagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {teams.map((team) => (
        <Link
          key={team.name}
          href={`/teams/${teamNameToSlug(team.name)}/`}
          title={`${team.name} (${team.score} pts)${team.remaining ? "" : " — eliminated"}`}
          className={`transition hover:scale-110 ${
            team.remaining ? "" : "opacity-35 grayscale"
          }`}
        >
          {team.crest ? (
            <Image
              src={team.crest}
              alt={team.name}
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-white/50">
              {team.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
