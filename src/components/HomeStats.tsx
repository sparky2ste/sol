"use client";

import { useEffect, useState } from "react";
import { lamportsToSol } from "@/lib/format";

interface Stats {
  totalReclaimSol: string;
  totalBurnSol: string;
  reclaimCount: number;
  burnCount: number;
}

export function HomeStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/community-goals");
        const data = (await res.json()) as {
          reclaim?: { totalLamports?: number; activityCount?: number };
          burn?: { totalLamports?: number; activityCount?: number };
        };
        if (cancelled) return;
        setStats({
          totalReclaimSol: lamportsToSol(data.reclaim?.totalLamports ?? 0, 1),
          totalBurnSol: lamportsToSol(data.burn?.totalLamports ?? 0, 1),
          reclaimCount: data.reclaim?.activityCount ?? 0,
          burnCount: data.burn?.activityCount ?? 0,
        });
      } catch {
        if (!cancelled) setStats(null);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const items = [
    {
      label: "Community reclaimed",
      value: stats ? `${stats.totalReclaimSol} SOL` : "—",
      sub: stats ? `${stats.reclaimCount} reclaims` : "Loading…",
      accent: "text-[#14F195]",
    },
    {
      label: "Community burned",
      value: stats ? `${stats.totalBurnSol} SOL` : "—",
      sub: stats ? `${stats.burnCount} burns` : "Loading…",
      accent: "text-orange-400",
    },
    {
      label: "Platform fee",
      value: "1%",
      sub: "Only on recovered SOL",
      accent: "text-zinc-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {items.map((item, i) => (
        <div
          key={item.label}
          className="animate-fade-in-up rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-4 py-3 backdrop-blur-sm"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {item.label}
          </p>
          <p className={`font-display mt-1 text-xl font-bold tabular-nums ${item.accent}`}>
            {item.value}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
