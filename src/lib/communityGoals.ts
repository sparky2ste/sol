const LAMPORTS_PER_SOL = 1_000_000_000;

export type GoalKind = "burn" | "reclaim";

export interface GoalProgress {
  kind: GoalKind;
  totalLamports: number;
  activityCount: number;
  currentGoalLamports: number;
  completedGoalsLamports: number[];
  lastCompletedGoalLamports: number | null;
  progressPercent: number;
  tierNumber: number;
}

function parseTierList(envValue: string | undefined, fallback: number[]): number[] {
  if (!envValue?.trim()) {
    return fallback;
  }

  const parsed = envValue
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);

  return parsed.length > 0 ? parsed : fallback;
}

export function getGoalTiersSol(kind: GoalKind): number[] {
  if (kind === "burn") {
    return parseTierList(process.env.NEXT_PUBLIC_BURN_GOAL_TIERS, [
      25, 50, 100, 250, 500, 1000,
    ]);
  }

  return parseTierList(process.env.NEXT_PUBLIC_RECLAIM_GOAL_TIERS, [
    50, 100, 250, 500, 1000, 2500,
  ]);
}

export function buildGoalProgress(
  kind: GoalKind,
  totalLamports: number,
  activityCount: number
): GoalProgress {
  const tiersLamports = getGoalTiersSol(kind).map(
    (sol) => Math.floor(sol * LAMPORTS_PER_SOL)
  );

  const completedGoalsLamports: number[] = [];
  let floorLamports = 0;
  let currentGoalLamports = tiersLamports[0] ?? LAMPORTS_PER_SOL * 100;

  for (const tier of tiersLamports) {
    if (totalLamports >= tier) {
      completedGoalsLamports.push(tier);
      floorLamports = tier;
      continue;
    }

    currentGoalLamports = tier;
    const span = tier - floorLamports;
    const progressPercent =
      span > 0 ? Math.min(100, ((totalLamports - floorLamports) / span) * 100) : 0;

    return {
      kind,
      totalLamports,
      activityCount,
      currentGoalLamports,
      completedGoalsLamports,
      lastCompletedGoalLamports:
        completedGoalsLamports[completedGoalsLamports.length - 1] ?? null,
      progressPercent,
      tierNumber: completedGoalsLamports.length + 1,
    };
  }

  let goal = tiersLamports[tiersLamports.length - 1] ?? currentGoalLamports;
  while (totalLamports >= goal) {
    completedGoalsLamports.push(goal);
    floorLamports = goal;
    goal *= 2;
  }

  currentGoalLamports = goal;
  const span = currentGoalLamports - floorLamports;
  const progressPercent =
    span > 0 ? Math.min(100, ((totalLamports - floorLamports) / span) * 100) : 0;

  return {
    kind,
    totalLamports,
    activityCount,
    currentGoalLamports,
    completedGoalsLamports,
    lastCompletedGoalLamports:
      completedGoalsLamports[completedGoalsLamports.length - 1] ?? null,
    progressPercent,
    tierNumber: completedGoalsLamports.length + 1,
  };
}
