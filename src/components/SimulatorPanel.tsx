"use client";

import { useMemo, useState, useTransition } from "react";
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

import { PerformanceChart } from "@/components/PerformanceChart";
import {
  getCompletedCheckpoint,
  getCurrentLiveScores,
  getLiveParticipantScores,
} from "@/lib/simulation/live-scores";
import { loadSimulationData } from "@/lib/simulation/load-data";
import { runMonteCarlo } from "@/lib/simulation/monte-carlo";
import {
  formatCheckpointLabel,
  STAGE_CHECKPOINTS,
  type StageCheckpoint,
} from "@/lib/simulation/stages";

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

const SIM_OPTIONS = [500, 2000, 5000];

export function SimulatorPanel() {
  const simulationData = useMemo(() => loadSimulationData(), []);
  const [simCount, setSimCount] = useState(simulationData.simConfig.defaultSimCount);
  const [result, setResult] = useState<ReturnType<typeof runMonteCarlo> | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const baseline = simulationData.baseline;
  const currentCheckpoint = useMemo(
    () => getCompletedCheckpoint(simulationData.fixtures),
    [simulationData.fixtures],
  );

  const comparisonStage: StageCheckpoint = currentCheckpoint ?? "GROUP_STAGE";

  const actualScores = useMemo(() => {
    if (currentCheckpoint) {
      return getLiveParticipantScores(
        simulationData.participants,
        simulationData.draft,
        simulationData.teams,
        currentCheckpoint,
        simulationData.scoring,
      );
    }
    return getCurrentLiveScores(
      simulationData.participants,
      simulationData.draft,
      simulationData.teams,
    );
  }, [currentCheckpoint, simulationData]);

  function handleRun() {
    startTransition(() => {
      const next = runMonteCarlo(simulationData, simCount, {
        anchorResults: true,
      });
      setResult(next);
    });
  }

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    const scoreSet = new Set<number>();
    for (const projection of result.projections) {
      for (const score of projection.scores) {
        scoreSet.add(score);
      }
    }

    const scores = [...scoreSet].sort((a, b) => a - b).slice(0, 40);

    return scores.map((score) => {
      const row: Record<string, string | number> = { score };
      for (const projection of result.projections) {
        row[projection.participant] = projection.scores.filter(
          (value) => value === score,
        ).length;
      }
      return row;
    });
  }, [result]);

  const performanceData = useMemo(() => {
    const expectedAtStage = baseline.stageMedians[comparisonStage];

    return simulationData.participants.map((participant) => ({
      participant,
      actual: actualScores[participant] ?? 0,
      expected: expectedAtStage?.[participant] ?? 0,
    }));
  }, [
    actualScores,
    baseline.stageMedians,
    comparisonStage,
    simulationData.participants,
  ]);

  const leader = result?.projections[0];
  const comparisonLabel = currentCheckpoint
    ? formatCheckpointLabel(currentCheckpoint)
    : "Group stage (pre-tournament projection)";

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-gold/20 bg-navy-light/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
              PELE Monte Carlo
            </p>
            <h2 className="text-3xl font-bold text-white">Projected Standings</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Simulates remaining World Cup matches using Silver Bulletin PELE
              ratings, FIFA Annex C bracket routing, and your pool scoring
              rules. Completed matches are locked to real results.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-white/70">
              Simulations
              <select
                value={simCount}
                onChange={(event) => setSimCount(Number(event.target.value))}
                className="ml-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              >
                {SIM_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleRun}
              disabled={isPending}
              className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-navy transition hover:bg-gold/90 disabled:opacity-60"
            >
              {isPending ? "Running..." : result ? "Re-run" : "Run simulation"}
            </button>
          </div>
        </div>

        {result && (
          <p className="mt-4 text-sm text-white/60">
            {result.finishedMatches} group matches locked ·{" "}
            {result.totalMatches - result.finishedMatches} simulated per run
            (72 group + 32 knockout) · {result.iterations.toLocaleString()} runs
          </p>
        )}
      </section>

      {leader && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-gold/30 bg-gold/10 p-5">
            <p className="text-xs uppercase tracking-wide text-gold">
              Projected leader
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {leader.participant}
            </p>
            <p className="text-sm text-white/70">
              {leader.mean.toFixed(1)} avg pts ·{" "}
              {(leader.winProbability * 100).toFixed(0)}% win chance
            </p>
          </div>
          <div className="rounded-2xl border border-emerald/30 bg-emerald/10 p-5">
            <p className="text-xs uppercase tracking-wide text-emerald">
              Leader range
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {leader.p10}–{leader.p90} pts
            </p>
            <p className="text-sm text-white/70">10th to 90th percentile</p>
          </div>
          <div className="rounded-2xl border border-accent-blue/30 bg-accent-blue/10 p-5">
            <p className="text-xs uppercase tracking-wide text-accent-blue">
              Tournament stage
            </p>
            <p className="mt-1 text-lg font-bold text-white">
              {currentCheckpoint
                ? formatCheckpointLabel(currentCheckpoint)
                : "In progress"}
            </p>
            <p className="text-sm text-white/70">
              {currentCheckpoint
                ? "Latest completed round"
                : "Group stage or earlier — using live scores"}
            </p>
          </div>
        </div>
      )}

      <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Actual vs expected
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Pre-tournament PELE simulation for your draft ({baseline.iterations.toLocaleString()}{" "}
            runs, generated{" "}
            {new Date(baseline.generatedAt).toLocaleDateString()}). Compares
            each person&apos;s current score to the median expected points after{" "}
            {comparisonLabel.toLowerCase()}.
          </p>
        </div>

        <section className="mb-6 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Participant
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Actual
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Expected
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  +/- 
                </th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((row) => {
                const delta = row.actual - row.expected;
                return (
                  <tr key={row.participant} className="border-b border-white/5">
                    <td className="px-3 py-2 font-semibold text-white">
                      {row.participant}
                    </td>
                    <td className="px-3 py-2 text-emerald">{row.actual}</td>
                    <td className="px-3 py-2 text-white/70">
                      {row.expected.toFixed(1)}
                    </td>
                    <td
                      className={`px-3 py-2 font-semibold ${
                        delta >= 0 ? "text-emerald" : "text-rose-400"
                      }`}
                    >
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <PerformanceChart data={performanceData} />

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-white/50 hover:text-white/70">
            Stage-by-stage expected points
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-2 py-2 text-left text-white/60">Stage</th>
                  {simulationData.participants.map((participant) => (
                    <th
                      key={participant}
                      className="px-2 py-2 text-left text-white/60"
                    >
                      {participant}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAGE_CHECKPOINTS.map((stage: StageCheckpoint) => (
                  <tr key={stage} className="border-b border-white/5">
                    <td className="px-2 py-2 text-white/80">
                      {formatCheckpointLabel(stage)}
                    </td>
                    {simulationData.participants.map((participant) => (
                      <td key={participant} className="px-2 py-2 text-white/60">
                        {baseline.stageMedians[stage]?.[participant]?.toFixed(
                          1,
                        ) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {result && (
        <section className="overflow-x-auto rounded-3xl border border-white/10 bg-navy-light/60">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 bg-black/20">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Mean
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Median
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  10th %
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  90th %
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/60">
                  Win %
                </th>
              </tr>
            </thead>
            <tbody>
              {result.projections.map((projection, index) => (
                <tr
                  key={projection.participant}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-semibold text-white">
                    <span className="mr-2 text-gold">#{index + 1}</span>
                    {projection.participant}
                  </td>
                  <td className="px-4 py-3 font-bold text-gold">
                    {projection.mean.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-white">{projection.median}</td>
                  <td className="px-4 py-3 text-white/80">{projection.p10}</td>
                  <td className="px-4 py-3 text-white/80">{projection.p90}</td>
                  <td className="px-4 py-3 text-emerald">
                    {(projection.winProbability * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {result && chartData.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-navy-light/60 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Score distributions
          </h3>
          <div className="h-96 min-h-96 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                <XAxis dataKey="score" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #d4af3740",
                    borderRadius: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                {result.projections.map((projection, index) => (
                  <Bar
                    key={projection.participant}
                    dataKey={projection.participant}
                    stackId="scores"
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {!result && (
        <div className="rounded-3xl border border-white/10 bg-navy-light/60 p-8 text-center text-white/60">
          Run the simulation to see projected draft pool standings.
        </div>
      )}
    </div>
  );
}
