import { getWorkersAi, ORACLE_AI_MODEL } from "@/lib/cloudflare/ai";
import type {
  OracleMarketData,
  OracleReport,
  OracleSocialMention,
  OracleVerdict,
} from "./types";

export interface AiVerdictInput {
  mint: string;
  symbol: string;
  name: string;
  description?: string;
  imageUrl?: string;
  market: OracleMarketData | null;
  mintRenounced: boolean;
  freezeRenounced: boolean;
  top10Percent: number;
  devHoldPercent: number;
  lpHoldPercent: number;
  botLikePercent: number;
  bundlerCount: number;
  bundlerSignals: { address: string; percent: number; reason: string }[];
  topHolders: { address: string; percent: number; tags: string[] }[];
  holderCountEstimate: number;
  socialMentions: OracleSocialMention[];
  websites: string[];
}

interface AiVerdictPayload {
  summary: string;
  opinion: string;
  confidence: number;
  rating: OracleVerdict["rating"];
  mcapPrediction: {
    lowUsd: number;
    midUsd: number;
    highUsd: number;
    horizon: string;
    trend: OracleVerdict["mcapPrediction"]["trend"];
  };
  risks: string[];
  opportunities: string[];
  signals: { label: string; score: number }[];
  narrativeCatalysts?: string[];
}

const SYSTEM_PROMPT = `You are a Solana memecoin trader writing for CT (Crypto Twitter). You give blunt, specific takes on tokens.

Rules:
- Write like a human trader. Short sentences. No corporate fluff. No em dashes.
- Memecoins move on NARRATIVE as much as on-chain data. Weight narrative heavily.
- If the name, ticker, or description ties to Trump, Elon, SpaceX, Tesla, AI hype, political figures, celebrities, or crypto influencers (Ansem, Murad, Cobie, etc.), call that out. A big account posting can 10x a coin overnight even with ugly holders.
- If there is no narrative hook and the pool is old with low volume and red charts, call it dead or bleeding. Downside is real. Coins go down, not always up.
- Old + low volume + dumping = likely slow death unless a fresh catalyst appears.
- Base mcap predictions on the CURRENT market cap provided. Bear/likely/bull cases should reflect trend direction.
- Do not invent live tweets you cannot verify. Instead say what WOULD change the trade if that catalyst hit (e.g. "If Ansem tweets this, mcap could rip to X").
- Return ONLY valid JSON matching the schema. No markdown fences.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    opinion: { type: "string" },
    confidence: { type: "number" },
    rating: {
      type: "string",
      enum: ["avoid", "caution", "neutral", "bullish", "degen"],
    },
    mcapPrediction: {
      type: "object",
      properties: {
        lowUsd: { type: "number" },
        midUsd: { type: "number" },
        highUsd: { type: "number" },
        horizon: { type: "string" },
        trend: { type: "string", enum: ["bearish", "neutral", "bullish"] },
      },
      required: ["lowUsd", "midUsd", "highUsd", "horizon", "trend"],
    },
    risks: { type: "array", items: { type: "string" } },
    opportunities: { type: "array", items: { type: "string" } },
    signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "number" },
        },
        required: ["label", "score"],
      },
    },
    narrativeCatalysts: { type: "array", items: { type: "string" } },
  },
  required: [
    "summary",
    "opinion",
    "confidence",
    "rating",
    "mcapPrediction",
    "risks",
    "opportunities",
    "signals",
  ],
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function parseAiJson(raw: unknown): AiVerdictPayload {
  let text: string;
  if (typeof raw === "string") {
    text = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    "response" in raw &&
    typeof (raw as { response?: string }).response === "string"
  ) {
    text = (raw as { response: string }).response;
  } else {
    throw new Error("Oracle AI returned an empty response.");
  }

  const trimmed = text.trim();
  try {
    if (trimmed.startsWith("{")) {
      return JSON.parse(trimmed) as AiVerdictPayload;
    }
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1]) as AiVerdictPayload;
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as AiVerdictPayload;
    }
  } catch {
    throw new Error("Oracle AI returned invalid JSON. Try again.");
  }
  throw new Error("Oracle AI returned invalid JSON. Try again.");
}

function normalizeRating(value: string): OracleVerdict["rating"] {
  const ratings: OracleVerdict["rating"][] = [
    "avoid",
    "caution",
    "neutral",
    "bullish",
    "degen",
  ];
  return ratings.includes(value as OracleVerdict["rating"])
    ? (value as OracleVerdict["rating"])
    : "neutral";
}

function normalizeTrend(
  value: string
): OracleVerdict["mcapPrediction"]["trend"] {
  if (value === "bearish" || value === "bullish" || value === "neutral") {
    return value;
  }
  return "neutral";
}

function sanitizeMcapPrediction(
  pred: AiVerdictPayload["mcapPrediction"],
  currentMcap: number
): OracleVerdict["mcapPrediction"] {
  const base = Math.max(currentMcap, 1_000);
  const low = clamp(Math.round(pred.lowUsd), 0, base * 20);
  let mid = clamp(Math.round(pred.midUsd), low, base * 30);
  let high = clamp(Math.round(pred.highUsd), mid, base * 50);

  if (currentMcap > 0 && !Number.isFinite(pred.lowUsd)) {
    return {
      lowUsd: Math.round(base * 0.3),
      midUsd: Math.round(base * 0.7),
      highUsd: Math.round(base * 1.2),
      horizon: pred.horizon || "next few days",
      trend: normalizeTrend(pred.trend),
    };
  }

  return {
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    horizon: pred.horizon?.slice(0, 80) || "next few days",
    trend: normalizeTrend(pred.trend),
  };
}

function defaultSignals(): OracleReport["signals"] {
  return [
    { label: "Liquidity", score: 5, max: 10 },
    { label: "Holder health", score: 5, max: 10 },
    { label: "Social buzz", score: 5, max: 10 },
    { label: "Contract safety", score: 5, max: 10 },
    { label: "Momentum", score: 5, max: 10 },
  ];
}

function normalizeSignals(
  signals: AiVerdictPayload["signals"]
): OracleReport["signals"] {
  if (!signals?.length) return defaultSignals();

  const labels = [
    "Liquidity",
    "Holder health",
    "Social buzz",
    "Contract safety",
    "Momentum",
  ];
  const byLabel = new Map(
    (signals ?? []).map((s) => [s.label.toLowerCase(), s.score])
  );

  return labels.map((label) => ({
    label,
    score: clamp(Math.round(byLabel.get(label.toLowerCase()) ?? 5), 1, 10),
    max: 10 as const,
  }));
}

function buildTokenContext(input: AiVerdictInput): string {
  return JSON.stringify(
    {
      mint: input.mint,
      symbol: input.symbol,
      name: input.name,
      description: input.description ?? null,
      websites: input.websites,
      socialLinks: input.socialMentions.filter((m) => m.source !== "search"),
      market: input.market
        ? {
            marketCapUsd: input.market.marketCapUsd,
            liquidityUsd: input.market.liquidityUsd,
            volume24hUsd: input.market.volume24hUsd,
            priceChange24h: input.market.priceChange24h,
            priceChange1h: input.market.priceChange1h,
            pairAgeHours: input.market.pairAgeHours,
            dexId: input.market.dexId,
            boostsActive: input.market.boostsActive,
            txns24h: input.market.txns24h,
          }
        : null,
      onChain: {
        mintRenounced: input.mintRenounced,
        freezeRenounced: input.freezeRenounced,
        top10Percent: input.top10Percent,
        devHoldPercent: input.devHoldPercent,
        lpHoldPercent: input.lpHoldPercent,
        botLikePercent: input.botLikePercent,
        holderCountEstimate: input.holderCountEstimate,
        bundlerCount: input.bundlerCount,
        bundlerSignals: input.bundlerSignals.slice(0, 5),
        topHolders: input.topHolders.slice(0, 8).map((h) => ({
          address: h.address.slice(0, 8) + "...",
          percent: h.percent,
          tags: h.tags,
        })),
      },
      narrativeHints: {
        note: "Infer narrative potential from symbol/name/description (Trump, SpaceX, Elon, AI, political, influencer themes). We do not have live X/Twitter feed. Reason about catalyst sensitivity.",
      },
    },
    null,
    2
  );
}

export async function generateAiVerdict(input: AiVerdictInput): Promise<{
  signals: OracleReport["signals"];
  risks: string[];
  opportunities: string[];
  verdict: OracleVerdict;
}> {
  const ai = await getWorkersAi();
  const tokenContext = buildTokenContext(input);

  const result = await ai.run(ORACLE_AI_MODEL, {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Analyze this Solana memecoin and return JSON only.

Token data:
${tokenContext}

In opinion, use paragraph breaks (\\n\\n). Mention narrative catalysts explicitly if the name/ticker fits Trump, SpaceX, Elon, Ansem-style hype, etc. If chart is dead, say so.`,
      },
    ],
    max_tokens: 2048,
    temperature: 0.55,
    response_format: {
      type: "json_schema",
      json_schema: RESPONSE_SCHEMA,
    },
  });

  const parsed = parseAiJson(result);
  const currentMcap = input.market?.marketCapUsd ?? 0;

  let opportunities = (parsed.opportunities ?? []).slice(0, 8);
  if (parsed.narrativeCatalysts?.length) {
    opportunities = [
      ...parsed.narrativeCatalysts.slice(0, 3).map((c) => `Narrative: ${c}`),
      ...opportunities,
    ].slice(0, 8);
  }

  const verdict: OracleVerdict = {
    summary: parsed.summary?.trim() || "No summary from Oracle.",
    opinion: parsed.opinion?.trim() || "No detailed take from Oracle.",
    confidence: clamp(Math.round(parsed.confidence ?? 5), 1, 10),
    rating: normalizeRating(parsed.rating),
    mcapPrediction: sanitizeMcapPrediction(
      parsed.mcapPrediction,
      currentMcap
    ),
  };

  return {
    signals: normalizeSignals(parsed.signals),
    risks: (parsed.risks ?? []).slice(0, 8),
    opportunities,
    verdict,
  };
}
