"use client";

import { useEffect, useState } from "react";
import {
  formatRelativeTime,
  lamportsToSol,
  truncateAddress,
} from "@/lib/format";
import type { LeaderboardPeriod } from "@/lib/solana/fetchRecentClaims";
import { ui } from "@/lib/ui";

interface LeaderboardEntry {
  wallet: string;
  totalLamports: number;
  reclaimLamports: number;
  burnLamports: number;
  reclaimCount: number;
  burnCount: number;
  lastActivityAt: number | null;
}

const PERIODS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "all", label: "All time" },
];

function ActivityCell({
  count,
  lamports,
  tone,
}: {
  count: number;
  lamports: number;
  tone: "reclaim" | "burn";
}) {
  if (count === 0) {
    return <span className={ui.muted}>—</span>;
  }

  const color = tone === "reclaim" ? "text-[#14F195]" : "text-orange-400";

  return (
    <div>
      <p className={`font-medium tabular-nums ${color}`}>
        {lamportsToSol(lamports)} SOL
      </p>
      <p className={`text-xs ${ui.muted}`}>
        {count} {tone === "reclaim" ? "reclaim" : "burn"}
        {count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export function Leaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const res = await fetch(
          `/api/claims/leaderboard?limit=25&period=${period}`
        );
        const data = await res.json();
        if (!cancelled) setEntries(data.leaderboard ?? []);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/50 p-1">
          {PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriod(item.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                period === item.value
                  ? "bg-[#14F195] text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className={`text-xs ${ui.muted}`}>USD prices added soon.</p>
      </div>

      <div className={`${ui.card} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr
                className={`border-b border-zinc-800 text-left text-xs ${ui.muted}`}
              >
                <th className="px-5 py-3 font-normal">Rank</th>
                <th className="px-4 py-3 font-normal">Wallet</th>
                <th className="px-4 py-3 font-normal">Total</th>
                <th className="px-4 py-3 font-normal">Reclaims</th>
                <th className="px-4 py-3 font-normal">Burns</th>
                <th className="px-4 py-3 font-normal">USD</th>
                <th className="px-5 py-3 font-normal">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/60">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 animate-pulse rounded bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className={`px-5 py-12 text-center text-sm ${ui.muted}`}
                  >
                    No reclaims or burns in this period yet.
                  </td>
                </tr>
              ) : (
                entries.map((entry, index) => (
                  <tr
                    key={entry.wallet}
                    className="border-b border-zinc-800/60 transition-colors last:border-0 hover:bg-zinc-900/60"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                          index === 0
                            ? "bg-[#14F195]/15 text-[#14F195]"
                            : index === 1
                              ? "bg-zinc-800 text-zinc-300"
                              : index === 2
                                ? "bg-zinc-800/80 text-zinc-400"
                                : "text-zinc-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`https://solscan.io/account/${entry.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 font-mono text-xs transition-colors hover:text-zinc-50 ${ui.muted}`}
                      >
                        {truncateAddress(entry.wallet)}
                        <ExternalIcon />
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium tabular-nums text-zinc-50">
                        {lamportsToSol(entry.totalLamports)} SOL
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ActivityCell
                        count={entry.reclaimCount}
                        lamports={entry.reclaimLamports}
                        tone="reclaim"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <ActivityCell
                        count={entry.burnCount}
                        lamports={entry.burnLamports}
                        tone="burn"
                      />
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${ui.muted}`}>Soon</td>
                    <td
                      className={`whitespace-nowrap px-5 py-3.5 text-xs ${ui.muted}`}
                    >
                      {entry.lastActivityAt
                        ? formatRelativeTime(entry.lastActivityAt)
                        : "Recently"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg
      className="h-3 w-3 opacity-40"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
