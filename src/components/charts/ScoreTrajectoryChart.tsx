"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  formatMatchdayLabel,
  visiblePhaseBoundaries,
} from "@/lib/matchdays";
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

  const sorted: HistorySnapshot[] = [...history]
    .map((snapshot) => ({
      ...snapshot,
      matchday: typeof snapshot.matchday === "number" ? snapshot.matchday : 0,
    }))
    .sort((a, b) => a.matchday - b.matchday);

  const data = sorted.map((snapshot) => {
    const point: Record<string, string | number> = {
      matchday: snapshot.matchday,
      matchdayLabel: formatMatchdayLabel(snapshot.matchday),
    };

    for (const participant of participants) {
      point[participant] = Number(snapshot[participant] ?? 0);
    }

    return point;
  });

  const minMatchday = sorted[0]?.matchday ?? 0;
  const maxMatchday = sorted.at(-1)?.matchday ?? 0;
  const boundaries = visiblePhaseBoundaries(minMatchday, maxMatchday);

  return (
    <div className="h-80 min-h-80 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis
            type="number"
            dataKey="matchday"
            domain={[minMatchday, maxMatchday]}
            allowDecimals={false}
            stroke="#ffffff80"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) =>
              value === 0 ? "Pre" : `MD ${value}`
            }
          />
          <YAxis stroke="#ffffff80" tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(_, payload) => {
              const label = payload?.[0]?.payload?.matchdayLabel;
              return typeof label === "string" ? label : "";
            }}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #d4af3740",
              borderRadius: "12px",
            }}
          />
          <Legend />
          {boundaries.map((boundary) => (
            <ReferenceLine
              key={boundary.x}
              x={boundary.x}
              stroke="#ffffff35"
              strokeDasharray="4 4"
              label={{
                value: boundary.label,
                position: "insideTopLeft",
                fill: "#ffffff99",
                fontSize: 10,
              }}
            />
          ))}
          {participants.map((participant, index) => (
            <Line
              key={participant}
              type="monotone"
              dataKey={participant}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
