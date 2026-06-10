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

export function TeamContributionChart({ entries }: TeamContributionChartProps) {
  const teamNames = Array.from(
    new Set(entries.flatMap((entry) => Object.keys(entry.teamScores))),
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
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #d4af3740",
              borderRadius: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          {teamNames.map((team, index) => (
            <Bar
              key={team}
              dataKey={team}
              stackId="points"
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
