import Link from "next/link";

export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-navy-light/70 p-8 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        Coming Soon
      </p>
      <h2 className="mt-2 text-3xl font-bold text-white">What-If Simulator</h2>
      <p className="mt-4 text-white/70">
        Pick a future match result and see how the leaderboard would shift —
        plus remaining equity estimates for each participant.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-gold transition hover:bg-gold/10"
      >
        Back to leaderboard
      </Link>
    </div>
  );
}
