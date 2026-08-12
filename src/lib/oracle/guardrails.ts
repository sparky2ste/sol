import type { AiVerdictInput } from "./aiVerdict";
import type { OracleReport, OracleVerdict } from "./types";

export interface OnChainGuardrails {
  severity: "critical" | "high" | "medium" | "none";
  forcedRating: OracleVerdict["rating"] | null;
  maxConfidence: number;
  forceBearish: boolean;
  reasons: string[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function sniperHoldPercent(
  input: Pick<AiVerdictInput, "bundlerSignals">
): number {
  return input.bundlerSignals.reduce((sum, b) => sum + b.percent, 0);
}

export function assessOnChainGuardrails(
  input: AiVerdictInput
): OnChainGuardrails {
  const sniperPct = sniperHoldPercent(input);
  const reasons: string[] = [];

  if (input.bundlerCount >= 5 || sniperPct >= 35) {
    reasons.push(
      `${input.bundlerCount} sniper/bundler wallets hold ~${sniperPct.toFixed(0)}% of supply.`
    );
    return {
      severity: "critical",
      forcedRating: "avoid",
      maxConfidence: 2,
      forceBearish: true,
      reasons,
    };
  }

  if (
    input.bundlerCount >= 3 ||
    sniperPct >= 18 ||
    input.botLikePercent >= 45 ||
    input.top10Percent >= 65
  ) {
    reasons.push(
      `Heavy bundler/sniper footprint (${input.bundlerCount} flagged, ~${sniperPct.toFixed(0)}% in snipers).`
    );
    if (input.botLikePercent >= 45) {
      reasons.push(
        `~${input.botLikePercent.toFixed(0)}% of supply looks bot/sybil clustered.`
      );
    }
    if (input.top10Percent >= 65) {
      reasons.push(`Top 10 wallets sit on ~${input.top10Percent.toFixed(0)}%.`);
    }
    return {
      severity: "critical",
      forcedRating: "avoid",
      maxConfidence: 3,
      forceBearish: true,
      reasons,
    };
  }

  if (
    input.bundlerCount >= 2 ||
    sniperPct >= 10 ||
    input.devHoldPercent >= 15 ||
    !input.mintRenounced
  ) {
    if (input.bundlerCount >= 2) {
      reasons.push(
        `${input.bundlerCount} sniper/bundler wallets detected (~${sniperPct.toFixed(0)}% held).`
      );
    }
    if (!input.mintRenounced) reasons.push("Mint authority is not renounced.");
    if (input.devHoldPercent >= 15) {
      reasons.push(`Dev-linked wallets hold ~${input.devHoldPercent.toFixed(0)}%.`);
    }
    return {
      severity: "high",
      forcedRating: "avoid",
      maxConfidence: 4,
      forceBearish: true,
      reasons,
    };
  }

  if (input.top10Percent >= 55 || input.botLikePercent >= 30) {
    reasons.push("Holder concentration is elevated.");
    return {
      severity: "medium",
      forcedRating: "caution",
      maxConfidence: 5,
      forceBearish: true,
      reasons,
    };
  }

  return {
    severity: "none",
    forcedRating: null,
    maxConfidence: 10,
    forceBearish: false,
    reasons: [],
  };
}

const BULLISH_RATINGS = new Set<OracleVerdict["rating"]>(["bullish", "degen"]);

export function applyOnChainGuardrails(
  input: AiVerdictInput,
  verdict: OracleVerdict,
  risks: string[],
  opportunities: string[],
  signals: OracleReport["signals"]
): {
  verdict: OracleVerdict;
  risks: string[];
  opportunities: string[];
  signals: OracleReport["signals"];
} {
  const guard = assessOnChainGuardrails(input);
  if (guard.severity === "none") {
    return { verdict, risks, opportunities, signals };
  }

  const next = { ...verdict, mcapPrediction: { ...verdict.mcapPrediction } };
  const nextRisks = [...risks];
  const nextOpportunities = [...opportunities];
  let nextSignals = signals;

  for (const reason of guard.reasons) {
    if (!nextRisks.some((r) => r.includes(reason.slice(0, 24)))) {
      nextRisks.unshift(reason);
    }
  }

  if (guard.forcedRating) {
    next.rating = guard.forcedRating;
  }
  next.confidence = clamp(next.confidence, 1, guard.maxConfidence);

  if (guard.forceBearish) {
    next.mcapPrediction.trend = "bearish";
    const mcap = input.market?.marketCapUsd ?? 0;
    if (mcap > 0) {
      next.mcapPrediction.midUsd = Math.min(
        next.mcapPrediction.midUsd,
        Math.round(mcap * 0.55)
      );
      next.mcapPrediction.highUsd = Math.min(
        next.mcapPrediction.highUsd,
        Math.round(mcap * 0.75)
      );
      next.mcapPrediction.lowUsd = Math.min(
        next.mcapPrediction.lowUsd,
        Math.round(mcap * 0.25)
      );
    }
  }

  if (guard.severity === "critical" || guard.severity === "high") {
    nextOpportunities.length = 0;
    nextOpportunities.push(
      "On-chain data is ugly. Narrative hype does not fix bundled supply. Skip or gamble dust only."
    );

    nextSignals = nextSignals.map((s) =>
      s.label === "Holder health"
        ? { ...s, score: clamp(Math.min(s.score, 2), 1, 10) }
        : s.label === "Contract safety" && !input.mintRenounced
          ? { ...s, score: clamp(Math.min(s.score, 3), 1, 10) }
          : s
    );

    if (BULLISH_RATINGS.has(next.rating) || guard.forcedRating === "avoid") {
      const sniperPct = sniperHoldPercent(input);
      next.summary = `Do not buy. ${input.bundlerCount} sniper/bundler flag(s), ~${sniperPct.toFixed(0)}% in early wallets, holder map is trash.`;
    }
  }

  return {
    verdict: next,
    risks: nextRisks.slice(0, 8),
    opportunities: nextOpportunities.slice(0, 8),
    signals: nextSignals,
  };
}
