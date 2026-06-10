"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { LeaderboardEntry } from "@/lib/types";

interface StandingsBarChartProps {
  entries: LeaderboardEntry[];
}

export function StandingsBarChart({ entries }: StandingsBarChartProps) {
  const data = entries.map((entry) => ({
    name: entry.participant,
    score: entry.totalScore,
  }));

  return (
    <div className="h-72 min-h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis type="number" stroke="#ffffff80" />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#ffffff80"
            width={80}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #d4af3740",
              borderRadius: "12px",
            }}
          />
          <Bar dataKey="score" fill="#d4af37" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
