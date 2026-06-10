"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HistorySnapshot } from "@/lib/types";

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

interface ScoreTrajectoryChartProps {
  history: HistorySnapshot[];
  participants: string[];
}

export function ScoreTrajectoryChart({
  history,
  participants,
}: ScoreTrajectoryChartProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-white/60">
        Score history will appear after the first tournament update.
      </p>
    );
  }

  const data = history.map((snapshot) => {
    const point: Record<string, string | number> = {
      time: new Date(snapshot.timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    for (const participant of participants) {
      point[participant] = Number(snapshot[participant] ?? 0);
    }

    return point;
  });

  return (
    <div className="h-80 min-h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis dataKey="time" stroke="#ffffff80" tick={{ fontSize: 12 }} />
          <YAxis stroke="#ffffff80" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #d4af3740",
              borderRadius: "12px",
            }}
          />
          <Legend />
          {participants.map((participant, index) => (
            <Line
              key={participant}
              type="monotone"
              dataKey={participant}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
