"use client";

import { useEffect, useState } from "react";
import { LogoIcon } from "@/components/LogoIcon";
import {
  formatRelativeTime,
  lamportsToSol,
  truncateAddress,
} from "@/lib/format";
import { ui } from "@/lib/ui";

interface Claim {
  signature: string;
  wallet: string;
  amountLamports: number;
  timestamp: number | null;
  status: "success";
}

export function RecentClaims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/claims/recent?limit=10");
        const data = await res.json();
        if (!cancelled) setClaims(data.claims ?? []);
      } catch {
        if (!cancelled) setClaims([]);
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
  }, []);

  return (
    <section id="recent-claims" className="pb-12">
      <div className={`${ui.card} overflow-hidden`}>
        <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
          <LogoIcon className="h-8 w-8 shrink-0" />
          <h2 className="text-[15px] font-medium">
            Recent Claims by Our Users
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className={`border-b border-zinc-800 text-left text-xs ${ui.muted}`}>
                <th className="px-5 py-3 font-normal">Wallet</th>
                <th className="px-4 py-3 font-normal">Amount</th>
                <th className="px-4 py-3 font-normal">Date</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-zinc-800/50">
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 animate-pulse rounded bg-zinc-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : claims.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className={`px-5 py-12 text-center text-sm ${ui.muted}`}
                  >
                    No claims yet
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr
                    key={claim.signature}
                    className="border-b border-zinc-800/50 transition-colors last:border-0 hover:bg-zinc-900/80"
                  >
                    <td className="px-5 py-3.5">
                      <a
                        href={`https://solscan.io/account/${claim.wallet}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 font-mono text-xs transition-colors hover:text-zinc-50 ${ui.muted}`}
                      >
                        {truncateAddress(claim.wallet)}
                        <ExternalIcon />
                      </a>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium tabular-nums text-[#14F195]">
                        {lamportsToSol(claim.amountLamports)} SOL
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3.5 text-xs ${ui.muted}`}>
                      {claim.timestamp
                        ? formatRelativeTime(claim.timestamp)
                        : "Recently"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 text-xs text-[#14F195]">
                        <CheckIcon />
                        Success
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
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

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
