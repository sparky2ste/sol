"use client";

import { lamportsToSol } from "@/lib/format";
import type { GoalProgress } from "@/lib/communityGoals";
import { ui } from "@/lib/ui";

interface CommunityGoalCardProps {
  data: GoalProgress | null;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const COPY = {
  burn: {
    title: "Community burn",
    subtitle: "Junk tokens → SOL back in wallets",
    activity: "burn",
    activities: "burns",
    cta: "Your burn moves everyone closer.",
    icon: FlameIcon,
    glow: "shadow-[0_0_40px_-12px_rgba(251,146,60,0.35)]",
    ring: "ring-orange-500/20",
    border: "border-orange-500/15",
    bg: "from-orange-500/[0.07] via-zinc-900/80 to-zinc-950/90",
    iconBg: "from-orange-500/25 to-orange-600/10",
    accent: "text-orange-400",
    accentSoft: "text-orange-300/90",
    badge: "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/25",
    bar: "from-orange-500 via-amber-400 to-orange-300",
    barGlow: "shadow-[0_0_12px_rgba(251,146,60,0.5)]",
    live: "bg-orange-400",
    chip: "border-orange-500/30 bg-orange-500/10 text-orange-300",
    celebrate: "from-orange-500/10 via-transparent to-transparent",
  },
  reclaim: {
    title: "Community reclaim",
    subtitle: "Empty accounts → SOL unlocked together",
    activity: "reclaim",
    activities: "reclaims",
    cta: "Your reclaim pushes the bar up.",
    icon: ReclaimIcon,
    glow: "shadow-[0_0_40px_-12px_rgba(20,241,149,0.3)]",
    ring: "ring-[#14F195]/15",
    border: "border-[#14F195]/15",
    bg: "from-[#14F195]/[0.06] via-zinc-900/80 to-zinc-950/90",
    iconBg: "from-[#14F195]/20 to-emerald-600/10",
    accent: "text-[#14F195]",
    accentSoft: "text-emerald-300/90",
    badge: "bg-[#14F195]/12 text-[#14F195] ring-1 ring-[#14F195]/25",
    bar: "from-emerald-600 via-[#14F195] to-emerald-300",
    barGlow: "shadow-[0_0_12px_rgba(20,241,149,0.45)]",
    live: "bg-[#14F195]",
    chip: "border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]",
    celebrate: "from-[#14F195]/10 via-transparent to-transparent",
  },
} as const;

export function CommunityGoalCard({
  data,
  loading = false,
  compact = false,
  className = "",
}: CommunityGoalCardProps) {
  const kind = data?.kind ?? "burn";
  const theme = COPY[kind];
  const Icon = theme.icon;

  const currentSol = data ? lamportsToSol(data.totalLamports, 2) : "0";
  const goalSol = data ? lamportsToSol(data.currentGoalLamports, 0) : "—";
  const progress = data?.progressPercent ?? 0;
  const count = data?.activityCount ?? 0;
  const completed = data?.completedGoalsLamports ?? [];
  const tier = data?.tierNumber ?? 1;
  const remaining =
    data && data.currentGoalLamports > data.totalLamports
      ? lamportsToSol(data.currentGoalLamports - data.totalLamports, 2)
      : "0";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ring-1 ${theme.border} ${theme.bg} ${theme.ring} ${theme.glow} ${compact ? "p-4" : "p-5 sm:p-6"} ${className}`}
    >
      {!loading && completed.length > 0 && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.celebrate}`}
          aria-hidden="true"
        />
      )}

      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.iconBg} ring-1 ${theme.ring}`}
            >
              <Icon className={theme.accent} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className={`font-display text-sm font-semibold tracking-tight text-zinc-50 sm:text-base`}>
                  {theme.title}
                </p>
                {!loading && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-zinc-700/80">
                    <span
                      className={`h-1.5 w-1.5 animate-pulse rounded-full ${theme.live}`}
                    />
                    Live
                  </span>
                )}
              </div>
              {!compact && (
                <p className={`mt-0.5 text-xs ${ui.muted}`}>{theme.subtitle}</p>
              )}
              {!loading && (
                <p className={`mt-1 text-xs font-medium ${theme.accentSoft}`}>
                  Goal {tier} · {goalSol} SOL
                </p>
              )}
            </div>
          </div>

          {!loading && completed.length > 0 && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${theme.badge}`}
            >
              {completed.length} unlocked
            </span>
          )}
        </div>

        {!loading && completed.length > 0 && (
          <div className={`flex flex-wrap gap-1.5 ${compact ? "mb-3 mt-3" : "mb-4 mt-4"}`}>
            {completed.map((goalLamports) => (
              <span
                key={goalLamports}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${theme.chip}`}
              >
                <TrophyIcon />
                {lamportsToSol(goalLamports, 0)} SOL
              </span>
            ))}
          </div>
        )}

        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            {loading ? (
              <span className="inline-block h-9 w-32 animate-pulse rounded-lg bg-zinc-800" />
            ) : (
              <>
                <p className="font-display text-3xl font-bold tabular-nums tracking-tight text-zinc-50 sm:text-4xl">
                  {currentSol}
                  <span className={`ml-1.5 text-lg font-normal sm:text-xl ${ui.muted}`}>
                    SOL
                  </span>
                </p>
                <p className={`mt-0.5 text-xs ${ui.muted}`}>
                  of {goalSol} SOL community total
                </p>
              </>
            )}
          </div>

          {!loading && (
            <div className="text-right">
              <p className={`font-display text-2xl font-bold tabular-nums ${theme.accent}`}>
                {Math.round(progress)}%
              </p>
              <p className={`text-[11px] ${ui.muted}`}>
                {count.toLocaleString()}{" "}
                {count === 1 ? theme.activity : theme.activities}
              </p>
            </div>
          )}
        </div>

        <div
          className={`relative overflow-hidden rounded-full bg-zinc-800/90 ${compact ? "h-2" : "h-2.5"}`}
        >
          <div
            className={`relative h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${theme.bar} ${progress > 5 ? theme.barGlow : ""}`}
            style={{ width: loading ? "0%" : `${Math.max(progress, 1.5)}%` }}
          >
            {!loading && progress > 0 && (
              <span
                className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent"
                aria-hidden="true"
              />
            )}
          </div>
        </div>

        {!compact && !loading && (
          <p className={`mt-3.5 text-xs leading-relaxed ${ui.muted}`}>
            {progress >= 99 ? (
              <span className={theme.accentSoft}>
                Almost there — {remaining} SOL left to hit goal {tier}.
              </span>
            ) : completed.length > 0 ? (
              <>
                <span className={theme.accentSoft}>
                  {completed.length} goal{completed.length === 1 ? "" : "s"} crushed.
                </span>{" "}
                {remaining} SOL to goal {tier}. {theme.cta}
              </>
            ) : (
              <>
                {remaining} SOL to unlock goal 1. {theme.cta}
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M5 3h14v2a5 5 0 01-4.5 4.98V12H18v2H6v-2h3.5V9.98A5 5 0 015 5V3zm2 0v2a3 3 0 003 3h4a3 3 0 003-3V3H7zm-2 16h14v2H5v-2z" />
    </svg>
  );
}

function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 23c-3.9 0-7-2.4-8.4-6.1C2.3 13.7 3.5 10.8 6 8.9 6.8 8.2 7.5 7.3 8 6.2 8.4 7.4 9.2 8.4 10.3 9c.3-2.1 1.4-4 3.2-5.4 1.1 2.1 3.3 3.5 5.8 3.5.2 0 .4 0 .7-.1-.8 1.6-1.2 3.3-1.2 5.1 0 4.2 2.4 7.8 6 9.6-.9.9-2.1 1.4-3.8 1.4z" />
    </svg>
  );
}

function ReclaimIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h5M20 20v-5h-5M20 9A8.1 8.1 0 004.6 7.5M4 15a8.1 8.1 0 0015.4 1.5"
      />
    </svg>
  );
}
