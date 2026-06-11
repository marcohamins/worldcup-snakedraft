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

interface PerformanceChartProps {
  data: {
    participant: string;
    actual: number;
    expected: number;
  }[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <div className="h-96 min-h-96 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
          <XAxis
            dataKey="participant"
            stroke="#ffffff80"
            tick={{ fontSize: 11 }}
          />
          <YAxis stroke="#ffffff80" />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #d4af3740",
              borderRadius: "12px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "11px" }} />
          <Bar dataKey="actual" name="Actual" fill="#2dd4bf" />
          <Bar dataKey="expected" name="Expected" fill="#a78bfa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
