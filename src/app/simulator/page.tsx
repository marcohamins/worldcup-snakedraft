import Link from "next/link";

import { SimulatorPanel } from "@/components/SimulatorPanel";

export default function SimulatorPage() {
  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gold hover:underline">
        ← Back to leaderboard
      </Link>
      <SimulatorPanel />
    </div>
  );
}
