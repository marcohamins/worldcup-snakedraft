import Image from "next/image";
import Link from "next/link";

import { withBasePath } from "@/lib/config";

const navItems = [
  { href: "/", label: "Leaderboard" },
  { href: "/ownership/", label: "Ownership" },
  { href: "/stats/", label: "Pool Stats" },
  { href: "/simulator/", label: "What-If" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-gold/20 bg-navy/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={withBasePath("/wc26-emblem.png")}
            alt="FIFA World Cup 26"
            width={48}
            height={48}
            className="h-12 w-12 object-contain"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              FIFA World Cup 26
            </p>
            <h1 className="text-lg font-bold text-white sm:text-xl">
              Snake Draft Tracker
            </h1>
          </div>
        </Link>
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/90 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
