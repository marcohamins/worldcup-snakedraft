"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LeaderboardEntry } from "@/lib/types";

const COLORS = [
  "#d4af37",
  "#2dd4bf",
  "#f97316",
  "#a78bfa",
  "#f43f5e",
  "#38bdf8",
  "#84cc16",
  "#fb7185",
];

interface TeamContributionChartProps {
  entries: LeaderboardEntry[];
}

interface TooltipRow {
  name: string;
  value: number;
  color: string;
}

function ContributionTooltip({
  active,
  payload,
  label,
  teamColors,
  entries,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number; color: string }[];
  label?: string;
  teamColors: Map<string, string>;
  entries: LeaderboardEntry[];
}) {
  if (!active || !payload?.length || !label) {
    return null;
  }

  const entry = entries.find((item) => item.participant === label);
  if (!entry) {
    return null;
  }

  const ownedTeams = new Set(Object.keys(entry.teamScores));
  const rows: TooltipRow[] = payload
    .filter((item) => ownedTeams.has(String(item.dataKey)))
    .map((item) => ({
      name: String(item.dataKey),
      value: Number(item.value ?? 0),
      color: teamColors.get(String(item.dataKey)) ?? item.color,
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));

  return (
    <div className="rounded-xl border border-gold/25 bg-navy px-3 py-2 text-sm shadow-lg">
      <p className="mb-2 font-semibold text-white">{label}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-white/80">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: row.color }}
              />
              {row.name}
            </span>
            <span className="font-semibold text-gold">{row.value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-white/10 pt-2 text-xs text-white/60">
        Total: {entry.totalScore} pts
      </p>
    </div>
  );
}

export function TeamContributionChart({ entries }: TeamContributionChartProps) {
  const teamNames = Array.from(
    new Set(entries.flatMap((entry) => Object.keys(entry.teamScores))),
  );

  const teamColors = new Map(
    teamNames.map((team, index) => [team, COLORS[index % COLORS.length]]),
  );

  const data = entries.map((entry) => {
    const row: Record<string, string | number> = {
      participant: entry.participant,
    };

    for (const team of teamNames) {
      row[team] = entry.teamScores[team] ?? 0;
    }

    return row;
  });

  return (
    <div className="h-96 min-h-96 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis dataKey="participant" stroke="#ffffff80" tick={{ fontSize: 12 }} />
          <YAxis stroke="#ffffff80" tick={{ fontSize: 12 }} />
          <Tooltip
            content={
              <ContributionTooltip teamColors={teamColors} entries={entries} />
            }
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {teamNames.map((team) => (
            <Bar
              key={team}
              dataKey={team}
              stackId="points"
              fill={teamColors.get(team)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
