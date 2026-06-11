"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { TeamFlags } from "@/components/TeamFlags";
import { teamNameToSlug } from "@/lib/teams";
import type { LeaderboardEntry } from "@/lib/types";

type SortKey =
  | "rank"
  | "participant"
  | "totalScore"
  | "teamsRemaining"
  | "pointsBehindLeader"
  | "bestTeam"
  | "worstTeam";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [ascending, setAscending] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "participant":
          comparison = a.participant.localeCompare(b.participant);
          break;
        case "totalScore":
          comparison = a.totalScore - b.totalScore;
          break;
        case "teamsRemaining":
          comparison = a.teamsRemaining - b.teamsRemaining;
          break;
        case "pointsBehindLeader":
          comparison = a.pointsBehindLeader - b.pointsBehindLeader;
          break;
        case "bestTeam":
          comparison =
            (a.bestTeam?.score ?? 0) - (b.bestTeam?.score ?? 0);
          break;
        case "worstTeam":
          comparison =
            (a.worstTeam?.score ?? 0) - (b.worstTeam?.score ?? 0);
          break;
        default:
          comparison = a.rank - b.rank;
      }

      return ascending ? comparison : -comparison;
    });
    return copy;
  }, [entries, sortKey, ascending]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(key);
    setAscending(key === "participant");
  }

  function header(label: string, key: SortKey, title?: string) {
    const active = sortKey === key;
    return (
      <button
        type="button"
        title={title}
        onClick={() => handleSort(key)}
        className={`text-left text-xs font-semibold uppercase tracking-wide ${
          active ? "text-gold" : "text-white/60"
        }`}
      >
        {label}
        {active ? (ascending ? " ↑" : " ↓") : ""}
      </button>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-light/60">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 bg-black/20">
          <tr>
            <th className="px-4 py-3">{header("Rank", "rank")}</th>
            <th className="px-4 py-3">{header("Participant", "participant")}</th>
            <th className="px-4 py-3">{header("Score", "totalScore")}</th>
            <th className="px-4 py-3">{header("Teams Left", "teamsRemaining")}</th>
            <th className="px-4 py-3">
              {header(
                "Pts Behind",
                "pointsBehindLeader",
                "Points behind the current leader",
              )}
            </th>
            <th className="px-4 py-3">{header("Best Team", "bestTeam")}</th>
            <th className="px-4 py-3">{header("Worst Team", "worstTeam")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr
              key={entry.participant}
              className="border-b border-white/5 transition hover:bg-white/5"
            >
              <td className="px-4 py-3 font-bold text-gold">#{entry.rank}</td>
              <td className="px-4 py-3 font-semibold text-white">
                {entry.participant}
              </td>
              <td className="px-4 py-3 text-lg font-bold text-white">
                {entry.totalScore}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <TeamFlags teams={entry.ownedTeams} />
                  <span className="text-xs text-white/50">
                    {entry.teamsRemaining}/{entry.ownedTeams.length}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-white/60">
                {entry.pointsBehindLeader === 0
                  ? "—"
                  : `-${entry.pointsBehindLeader}`}
              </td>
              <td className="px-4 py-3">
                {entry.bestTeam ? (
                  <Link
                    href={`/teams/${teamNameToSlug(entry.bestTeam.name)}/`}
                    className="text-emerald hover:text-gold"
                  >
                    {entry.bestTeam.name} ({entry.bestTeam.score})
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {entry.worstTeam ? (
                  <Link
                    href={`/teams/${teamNameToSlug(entry.worstTeam.name)}/`}
                    className="text-rose-400/80 hover:text-gold"
                  >
                    {entry.worstTeam.name} ({entry.worstTeam.score})
                  </Link>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
