"use client";

import { useMemo, useState } from "react";

import type { ParticipantPoolStats } from "@/lib/types";

type SortKey = keyof Pick<
  ParticipantPoolStats,
  | "participant"
  | "gamesPlayed"
  | "goalsFor"
  | "goalsAgainst"
  | "goalDifference"
>;

interface PoolStatsTableProps {
  stats: ParticipantPoolStats[];
}

const columns: { key: SortKey; label: string }[] = [
  { key: "participant", label: "Participant" },
  { key: "gamesPlayed", label: "GP" },
  { key: "goalsFor", label: "GF" },
  { key: "goalsAgainst", label: "GA" },
  { key: "goalDifference", label: "GD" },
];

export function PoolStatsTable({ stats }: PoolStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("goalsFor");
  const [ascending, setAscending] = useState(false);

  const sorted = useMemo(() => {
    const copy = [...stats];
    copy.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const comparison =
        typeof aVal === "string"
          ? aVal.localeCompare(String(bVal))
          : Number(aVal) - Number(bVal);
      return ascending ? comparison : -comparison;
    });
    return copy;
  }, [stats, sortKey, ascending]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setAscending((value) => !value);
      return;
    }
    setSortKey(key);
    setAscending(key === "participant" || key === "goalsAgainst");
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-light/60">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 bg-black/20">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left">
                <button
                  type="button"
                  onClick={() => handleSort(column.key)}
                  className={`text-xs font-semibold uppercase tracking-wide ${
                    sortKey === column.key ? "text-gold" : "text-white/60"
                  }`}
                >
                  {column.label}
                  {sortKey === column.key ? (ascending ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr
              key={row.participant}
              className="border-b border-white/5 transition hover:bg-white/5"
            >
              <td className="px-4 py-3">
                <span className="mr-2 text-gold">#{index + 1}</span>
                <span className="font-semibold text-white">{row.participant}</span>
              </td>
              <td className="px-4 py-3 text-white/80">{row.gamesPlayed}</td>
              <td className="px-4 py-3 font-bold text-emerald">{row.goalsFor}</td>
              <td className="px-4 py-3 text-white/80">{row.goalsAgainst}</td>
              <td
                className={`px-4 py-3 font-semibold ${
                  row.goalDifference > 0
                    ? "text-emerald"
                    : row.goalDifference < 0
                      ? "text-accent-red"
                      : "text-white/60"
                }`}
              >
                {row.goalDifference > 0 ? "+" : ""}
                {row.goalDifference}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
