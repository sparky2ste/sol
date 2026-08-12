"use client";

import { useEffect, useState } from "react";
import type { GoalProgress } from "@/lib/communityGoals";
import { CommunityGoalCard } from "@/components/CommunityGoalCard";
import { ui } from "@/lib/ui";

interface CommunityGoalsData {
  burn: GoalProgress;
  reclaim: GoalProgress;
}

interface CommunityGoalsProps {
  kind?: "burn" | "reclaim" | "both";
  compact?: boolean;
  className?: string;
  showHeader?: boolean;
}

export function CommunityGoals({
  kind = "both",
  compact = false,
  className = "",
  showHeader,
}: CommunityGoalsProps) {
  const [data, setData] = useState<CommunityGoalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/community-goals");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
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

  const headerVisible = showHeader ?? kind === "both";

  if (kind === "burn") {
    return (
      <CommunityGoalCard
        data={data?.burn ?? null}
        loading={loading}
        compact={compact}
        className={className}
      />
    );
  }

  if (kind === "reclaim") {
    return (
      <CommunityGoalCard
        data={data?.reclaim ?? null}
        loading={loading}
        compact={compact}
        className={className}
      />
    );
  }

  return (
    <section className={className}>
      {headerVisible && (
        <div className={`${compact ? "mb-4" : "mb-5"}`}>
          <p className={`${ui.sectionEyebrow} uppercase tracking-widest`}>
            Community progress
          </p>
          <h2
            className={`${ui.heading} ${compact ? "text-lg" : "text-xl sm:text-2xl"}`}
          >
            Unlock goals together
          </h2>
          {!compact && (
            <p className={`mt-1.5 max-w-lg text-sm ${ui.muted}`}>
              Every reclaim and burn adds to the community total. Hit a tier,
              unlock the next — your action counts.
            </p>
          )}
        </div>
      )}

      <div className={`grid gap-4 ${compact ? "lg:grid-cols-2" : "sm:gap-5 lg:grid-cols-2"}`}>
        <CommunityGoalCard
          data={data?.reclaim ?? null}
          loading={loading}
          compact={compact}
        />
        <CommunityGoalCard
          data={data?.burn ?? null}
          loading={loading}
          compact={compact}
        />
      </div>
    </section>
  );
}
