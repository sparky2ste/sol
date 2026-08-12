export interface OracleMarketData {
  priceUsd: number;
  marketCapUsd: number;
  fdvUsd: number;
  liquidityUsd: number;
  volume24hUsd: number;
  priceChange24h: number;
  priceChange1h: number;
  pairAddress: string;
  dexId: string;
  pairCreatedAt: number | null;
  pairAgeHours: number | null;
  txns24h: number;
  boostsActive: number;
}

export interface OracleHolderWallet {
  address: string;
  percent: number;
  uiAmount: number;
  tags: string[];
}

export interface OracleSocialMention {
  platform: string;
  handle: string;
  url: string;
  source: "dexscreener" | "profile" | "search";
}

export interface OracleBundlerSignal {
  address: string;
  percent: number;
  reason: string;
}

export interface OracleVerdict {
  summary: string;
  opinion: string;
  confidence: number;
  rating: "avoid" | "caution" | "neutral" | "bullish" | "degen";
  mcapPrediction: {
    lowUsd: number;
    midUsd: number;
    highUsd: number;
    horizon: string;
  };
}

export interface OracleReport {
  mint: string;
  symbol: string;
  name: string;
  imageUrl?: string;
  description?: string;
  market: OracleMarketData | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  mintRenounced: boolean;
  freezeRenounced: boolean;
  holderCountEstimate: number;
  topHolders: OracleHolderWallet[];
  top10Percent: number;
  devHoldPercent: number;
  lpHoldPercent: number;
  botLikePercent: number;
  bundlerSignals: OracleBundlerSignal[];
  socialMentions: OracleSocialMention[];
  risks: string[];
  opportunities: string[];
  signals: { label: string; score: number; max: 10 }[];
  verdict: OracleVerdict;
  disclaimer: string;
  analyzedAt: number;
}
