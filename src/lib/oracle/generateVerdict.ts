import type {
  OracleMarketData,
  OracleReport,
  OracleSocialMention,
  OracleVerdict,
} from "./types";

interface VerdictInput {
  mint: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  description?: string;
  market: OracleMarketData | null;
  mintRenounced: boolean;
  freezeRenounced: boolean;
  top10Percent: number;
  devHoldPercent: number;
  lpHoldPercent: number;
  botLikePercent: number;
  bundlerCount: number;
  socialMentions: OracleSocialMention[];
  websites: string[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export function generateOracleVerdict(input: VerdictInput): {
  signals: OracleReport["signals"];
  risks: string[];
  opportunities: string[];
  verdict: OracleVerdict;
} {
  const mcap = input.market?.marketCapUsd ?? 0;
  const liquidity = input.market?.liquidityUsd ?? 0;
  const vol = input.market?.volume24hUsd ?? 0;
  const age = input.market?.pairAgeHours ?? null;

  const liqRatio = mcap > 0 ? liquidity / mcap : 0;
  const volRatio = mcap > 0 ? vol / mcap : 0;
  const hasTwitter = input.socialMentions.some((s) => s.platform === "twitter");
  const socialCount = input.socialMentions.length + input.websites.length;

  const liquidityScore = clamp(
    Math.round(
      (liqRatio >= 0.15 ? 8 : liqRatio >= 0.08 ? 6 : liqRatio >= 0.03 ? 4 : 2) +
        (liquidity >= 50_000 ? 2 : liquidity >= 10_000 ? 1 : 0)
    ),
    1,
    10
  );

  const holderScore = clamp(
    Math.round(
      10 -
        input.top10Percent / 12 -
        input.devHoldPercent / 8 -
        input.botLikePercent / 15 -
        input.bundlerCount * 0.8
    ),
    1,
    10
  );

  const socialScore = clamp(
    Math.round(
      (hasTwitter ? 4 : 0) +
        Math.min(3, socialCount) +
        (input.market?.boostsActive ? 2 : 0) +
        (volRatio > 0.5 ? 2 : volRatio > 0.2 ? 1 : 0)
    ),
    1,
    10
  );

  const safetyScore = clamp(
    Math.round(
      (input.mintRenounced ? 3 : 0) +
        (input.freezeRenounced ? 2 : 0) +
        (input.devHoldPercent < 5 ? 3 : input.devHoldPercent < 15 ? 1 : 0) +
        (input.lpHoldPercent >= 5 ? 2 : 0)
    ),
    1,
    10
  );

  const momentumScore = clamp(
    Math.round(
      5 +
        (input.market?.priceChange24h ?? 0) / 25 +
        (input.market?.priceChange1h ?? 0) / 15 +
        (volRatio > 1 ? 2 : 0)
    ),
    1,
    10
  );

  const signals = [
    { label: "Liquidity", score: liquidityScore, max: 10 as const },
    { label: "Holder health", score: holderScore, max: 10 as const },
    { label: "Social buzz", score: socialScore, max: 10 as const },
    { label: "Contract safety", score: safetyScore, max: 10 as const },
    { label: "Momentum", score: momentumScore, max: 10 as const },
  ];

  const risks: string[] = [];
  const opportunities: string[] = [];

  if (!input.mintRenounced) {
    risks.push("Mint authority is not renounced — supply can still be inflated.");
  }
  if (!input.freezeRenounced) {
    risks.push("Freeze authority active — accounts could be frozen.");
  }
  if (input.top10Percent > 55) {
    risks.push(
      `Top holders control ~${input.top10Percent.toFixed(0)}% — heavy concentration.`
    );
  }
  if (input.devHoldPercent > 10) {
    risks.push(
      `Dev-linked wallets hold ~${input.devHoldPercent.toFixed(1)}% — dump risk.`
    );
  }
  if (input.bundlerCount > 0) {
    risks.push(
      `${input.bundlerCount} early-buyer wallet(s) flagged — possible snipers/bundlers.`
    );
  }
  if (input.botLikePercent > 20) {
    risks.push(
      `~${input.botLikePercent.toFixed(0)}% of supply looks bot/sybil clustered.`
    );
  }
  if (liquidity < 5_000) {
    risks.push("Very thin liquidity — hard to exit size without slippage.");
  }
  if (age != null && age < 2) {
    risks.push("Pool is under 2 hours old — extreme volatility and rug risk.");
  }
  if (!input.market) {
    risks.push("No DexScreener market data — token may be untraded or illiquid.");
  }

  if (input.mintRenounced && input.freezeRenounced) {
    opportunities.push("Mint and freeze authority renounced.");
  }
  if (liqRatio >= 0.1) {
    opportunities.push("Healthy liquidity relative to market cap.");
  }
  if (volRatio > 0.3) {
    opportunities.push("Strong 24h volume vs market cap — active trading.");
  }
  if (hasTwitter) {
    opportunities.push("Twitter/X presence detected on DexScreener.");
  }
  if ((input.market?.boostsActive ?? 0) > 0) {
    opportunities.push("Paid DexScreener boost active — marketing spend detected.");
  }
  if (input.market?.priceChange24h && input.market.priceChange24h > 20) {
    opportunities.push(`Up ${input.market.priceChange24h.toFixed(0)}% in 24h — momentum bid.`);
  }

  if (risks.length === 0) {
    risks.push("Memecoins remain high risk — this scan is not financial advice.");
  }
  if (opportunities.length === 0) {
    opportunities.push("Limited positive signals — treat as speculative only.");
  }

  const avgScore =
    signals.reduce((s, x) => s + x.score, 0) / signals.length;

  let confidence = Math.round(avgScore);
  if (!input.market) confidence = Math.max(1, confidence - 3);
  if (input.bundlerCount > 2) confidence = Math.max(1, confidence - 1);
  confidence = clamp(confidence, 1, 10);

  const baseMcap = Math.max(mcap, 1_000);
  let lowMult = 0.5 + holderScore / 30;
  let midMult = 1.2 + momentumScore / 4 + socialScore / 8;
  let highMult = 2.5 + momentumScore / 2 + socialScore / 5;

  if (safetyScore < 4) {
    midMult *= 0.6;
    highMult *= 0.5;
  }
  if (holderScore < 4) {
    highMult *= 0.7;
  }
  if (age != null && age < 6) {
    midMult *= 1.4;
    highMult *= 2;
  }

  const mcapPrediction = {
    lowUsd: Math.round(baseMcap * lowMult),
    midUsd: Math.round(baseMcap * midMult),
    highUsd: Math.round(baseMcap * highMult),
    horizon: age != null && age < 24 ? "6–24 hours (high variance)" : "24h–7d",
  };

  let rating: OracleVerdict["rating"] = "neutral";
  if (safetyScore <= 3 || holderScore <= 3) rating = "avoid";
  else if (safetyScore <= 5 || risks.length >= 4) rating = "caution";
  else if (momentumScore >= 7 && socialScore >= 6) rating = "bullish";
  else if (momentumScore >= 8 && safetyScore <= 5) rating = "degen";

  const opinionParts = [
    `$${input.symbol} scans as a ${rating} memecoin setup with ${confidence}/10 oracle confidence.`,
    input.market
      ? `Trading at ${formatUsd(mcap)} mcap with ${formatUsd(liquidity)} liquidity on ${input.market.dexId}.`
      : "No live market found — treat CA as unverified or pre-launch.",
    `Holder map: top 10 hold ~${input.top10Percent.toFixed(0)}%, dev-linked ~${input.devHoldPercent.toFixed(1)}%, bot-like clustering ~${input.botLikePercent.toFixed(0)}%.`,
    input.bundlerCount > 0
      ? `${input.bundlerCount} wallet(s) match early sniper/bundler patterns.`
      : "No strong bundler fingerprints in top holders.",
    hasTwitter
      ? `Social: Twitter/X linked${socialCount > 1 ? " plus other links" : ""}.`
      : "Social: no verified Twitter on DexScreener — narrative is harder to verify.",
    `Model range (speculative): ${formatUsd(mcapPrediction.lowUsd)} floor → ${formatUsd(mcapPrediction.midUsd)} base → ${formatUsd(mcapPrediction.highUsd)} upside.`,
  ];

  const verdict: OracleVerdict = {
    summary:
      rating === "avoid"
        ? "High rug / concentration flags — proceed with extreme caution."
        : rating === "caution"
          ? "Mixed signals — size small, assume exit liquidity is thin."
          : rating === "bullish"
            ? "Signals align for a momentum play — still a memecoin."
            : rating === "degen"
              ? "Violent upside possible — safety scores are weak."
              : "Neutral meme setup — edge depends on narrative and flow.",
    opinion: opinionParts.join(" "),
    confidence,
    rating,
    mcapPrediction,
  };

  return { signals, risks, opportunities, verdict };
}

export function buildSocialMentions(
  symbol: string,
  socials: { platform: string; handle: string; url: string }[],
  websites: string[]
): OracleSocialMention[] {
  const mentions: OracleSocialMention[] = socials.map((s) => ({
    platform: s.platform,
    handle: s.handle,
    url: s.url,
    source: "dexscreener" as const,
  }));

  if (symbol && symbol !== "???") {
    mentions.push({
      platform: "twitter",
      handle: `$${symbol}`,
      url: `https://x.com/search?q=%24${encodeURIComponent(symbol)}&f=live`,
      source: "search",
    });
    mentions.push({
      platform: "twitter",
      handle: symbol,
      url: `https://x.com/search?q=${encodeURIComponent(symbol)}&f=live`,
      source: "search",
    });
  }

  for (const site of websites.slice(0, 3)) {
    try {
      mentions.push({
        platform: "website",
        handle: new URL(site).hostname,
        url: site,
        source: "profile",
      });
    } catch {
      mentions.push({
        platform: "website",
        handle: site.slice(0, 24),
        url: site,
        source: "profile",
      });
    }
  }

  const seen = new Set<string>();
  return mentions.filter((m) => {
    const key = `${m.platform}:${m.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
