import {
  getWorkersAi,
  ORACLE_AI_FALLBACK_MODEL,
  ORACLE_AI_MODEL,
} from "@/lib/cloudflare/ai";
import {
  applyOnChainGuardrails,
  assessOnChainGuardrails,
  sniperHoldPercent,
} from "./guardrails";
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

const SYSTEM_PROMPT = `You are a blunt Solana memecoin trader. Your job is to protect people from bundled rugs and sniper traps.

HARD RULES (never break these):
- If bundlerCount >= 2 OR sniperHoldPercent >= 10 OR botLikePercent >= 35 OR top10Percent >= 55: rating MUST be "avoid". Tell the user NOT to buy. No exceptions.
- Narrative (Trump, Elon, SpaceX, Ansem) does NOT override bundled/sniped supply. A hyped name with 60% in sniper wallets is still a hard avoid.
- Only use "bullish" or "degen" when bundlerCount <= 1, sniperHoldPercent < 8, top10Percent < 50, and mint is renounced.
- Old pool + low volume + red chart = dead/bleeding. Likely mcap path should be BELOW current mcap.
- Do not invent tweets. Say what would change the trade IF a catalyst hit.

Style:
- Write like CT, not like ChatGPT. Short sentences. No em dashes.
- Return ONLY valid JSON. No markdown fences.`;

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

function extractAiText(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw;

  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;

  if (typeof obj.response === "string" && obj.response.trim()) {
    return obj.response;
  }

  const post = obj.postProcessedOutputs as Record<string, unknown> | undefined;
  if (post && typeof post.response === "string" && post.response.trim()) {
    return post.response;
  }

  if (typeof obj.summary === "string" && typeof obj.opinion === "string") {
    return JSON.stringify(obj);
  }

  return null;
}

function parseAiJson(raw: unknown): AiVerdictPayload {
  const text = extractAiText(raw);
  if (!text) {
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
  currentMcap: number,
  forceBearish: boolean
): OracleVerdict["mcapPrediction"] {
  const base = Math.max(currentMcap, 1_000);

  if (!pred || !Number.isFinite(pred.midUsd)) {
    return {
      lowUsd: Math.round(base * (forceBearish ? 0.2 : 0.35)),
      midUsd: Math.round(base * (forceBearish ? 0.45 : 0.75)),
      highUsd: Math.round(base * (forceBearish ? 0.65 : 1.1)),
      horizon: "next few days",
      trend: forceBearish ? "bearish" : "neutral",
    };
  }

  let low = clamp(Math.round(pred.lowUsd), 0, base * 20);
  let mid = clamp(Math.round(pred.midUsd), low, base * 30);
  let high = clamp(Math.round(pred.highUsd), mid, base * 50);

  if (forceBearish && currentMcap > 0) {
    mid = Math.min(mid, Math.round(currentMcap * 0.55));
    high = Math.min(high, Math.round(currentMcap * 0.75));
    low = Math.min(low, Math.round(currentMcap * 0.3));
  }

  const trend = forceBearish
    ? "bearish"
    : normalizeTrend(pred.trend);

  return {
    lowUsd: low,
    midUsd: mid,
    highUsd: high,
    horizon: pred.horizon?.slice(0, 80) || "next few days",
    trend,
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
    signals.map((s) => [s.label.toLowerCase(), s.score])
  );

  return labels.map((label) => ({
    label,
    score: clamp(Math.round(byLabel.get(label.toLowerCase()) ?? 5), 1, 10),
    max: 10 as const,
  }));
}

function buildTokenContext(input: AiVerdictInput): string {
  const sniperPct = sniperHoldPercent(input);
  const guard = assessOnChainGuardrails(input);

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
        sniperHoldPercent: Math.round(sniperPct * 10) / 10,
        bundlerSignals: input.bundlerSignals.slice(0, 12),
        topHolders: input.topHolders.slice(0, 10).map((h) => ({
          percent: h.percent,
          tags: h.tags,
        })),
        guardrailSeverity: guard.severity,
        guardrailNotes: guard.reasons,
      },
    },
    null,
    2
  );
}

function buildUserPrompt(tokenContext: string, input: AiVerdictInput): string {
  const sniperPct = sniperHoldPercent(input);
  return `Analyze this Solana memecoin. Return JSON only.

Token data:
${tokenContext}

Key facts you MUST respect:
- bundlerCount=${input.bundlerCount}
- sniperHoldPercent=${sniperPct.toFixed(1)}%
- botLikePercent=${input.botLikePercent}%
- top10Percent=${input.top10Percent.toFixed(1)}%

If bundlerCount >= 2 or sniperHoldPercent >= 10, rating must be "avoid" and summary must say do not buy.

Use paragraph breaks (\\n\\n) in opinion.`;
}

async function runOracleModel(
  ai: Ai,
  model: string,
  userPrompt: string,
  useSchema: boolean
): Promise<unknown> {
  const body: {
    messages: { role: string; content: string }[];
    max_tokens: number;
    temperature: number;
    response_format?: {
      type: string;
      json_schema: typeof RESPONSE_SCHEMA;
    };
  } = {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2048,
    temperature: 0.35,
  };

  if (useSchema) {
    body.response_format = {
      type: "json_schema",
      json_schema: RESPONSE_SCHEMA,
    };
  }

  return ai.run(model, body);
}

async function fetchAiVerdictPayload(
  ai: Ai,
  userPrompt: string
): Promise<AiVerdictPayload> {
  const attempts: { model: string; useSchema: boolean }[] = [
    { model: ORACLE_AI_MODEL, useSchema: true },
    { model: ORACLE_AI_MODEL, useSchema: false },
    { model: ORACLE_AI_FALLBACK_MODEL, useSchema: false },
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const raw = await runOracleModel(
        ai,
        attempt.model,
        userPrompt,
        attempt.useSchema
      );
      return parseAiJson(raw);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("Oracle AI failed. Try again.");
}

export async function generateAiVerdict(input: AiVerdictInput): Promise<{
  signals: OracleReport["signals"];
  risks: string[];
  opportunities: string[];
  verdict: OracleVerdict;
}> {
  const ai = await getWorkersAi();
  const userPrompt = buildUserPrompt(buildTokenContext(input), input);
  const guard = assessOnChainGuardrails(input);
  const parsed = await fetchAiVerdictPayload(ai, userPrompt);
  const currentMcap = input.market?.marketCapUsd ?? 0;

  let opportunities = (parsed.opportunities ?? []).slice(0, 8);
  if (parsed.narrativeCatalysts?.length && guard.severity === "none") {
    opportunities = [
      ...parsed.narrativeCatalysts.slice(0, 3).map((c) => `Narrative: ${c}`),
      ...opportunities,
    ].slice(0, 8);
  }

  let verdict: OracleVerdict = {
    summary: parsed.summary?.trim() || "No summary from Oracle.",
    opinion: parsed.opinion?.trim() || "No detailed take from Oracle.",
    confidence: clamp(Math.round(parsed.confidence ?? 5), 1, 10),
    rating: normalizeRating(parsed.rating),
    mcapPrediction: sanitizeMcapPrediction(
      parsed.mcapPrediction,
      currentMcap,
      guard.forceBearish
    ),
  };

  let risks = (parsed.risks ?? []).slice(0, 8);
  let signals = normalizeSignals(parsed.signals);

  const guarded = applyOnChainGuardrails(
    input,
    verdict,
    risks,
    opportunities,
    signals
  );

  return {
    signals: guarded.signals,
    risks: guarded.risks,
    opportunities: guarded.opportunities,
    verdict: guarded.verdict,
  };
}
