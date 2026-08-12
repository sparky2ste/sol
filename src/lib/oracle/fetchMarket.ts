import type { OracleMarketData } from "./types";

interface DexPair {
  chainId?: string;
  dexId?: string;
  pairAddress?: string;
  priceUsd?: string;
  marketCap?: number;
  fdv?: number;
  liquidity?: { usd?: number };
  volume?: { h24?: number };
  priceChange?: { h24?: number; h1?: number };
  pairCreatedAt?: number;
  txns?: { h24?: { buys?: number; sells?: number } };
  boosts?: { active?: number };
  baseToken?: { address?: string; symbol?: string; name?: string };
  info?: {
    imageUrl?: string;
    websites?: { url: string }[];
    socials?: {
      platform?: string;
      type?: string;
      handle?: string;
      url?: string;
    }[];
  };
}

function pickBestSolanaPair(pairs: DexPair[]): DexPair | null {
  const solana = pairs.filter((p) => p.chainId === "solana");
  if (solana.length === 0) return pairs[0] ?? null;

  return solana.sort((a, b) => {
    const liqA = a.liquidity?.usd ?? 0;
    const liqB = b.liquidity?.usd ?? 0;
    return liqB - liqA;
  })[0];
}

function mapSocials(pair: DexPair) {
  return (
    pair.info?.socials?.map((s) => {
      const platform = s.platform ?? s.type ?? "link";
      const url = s.url;
      if (url) {
        let handle = s.handle ?? "";
        if (!handle) {
          try {
            handle = new URL(url).hostname.replace("www.", "");
          } catch {
            handle = url.slice(0, 32);
          }
        }
        return { platform, handle, url };
      }
      const handle = s.handle ?? "";
      return {
        platform,
        handle,
        url:
          platform === "twitter" || platform === "x"
            ? `https://x.com/${handle.replace("@", "")}`
            : platform === "telegram"
              ? `https://t.me/${handle.replace("@", "")}`
              : handle.startsWith("http")
                ? handle
                : `https://${platform}.com/${handle.replace("@", "")}`,
      };
    }) ?? []
  );
}

function pairToResult(pair: DexPair, fallbackAddress: string) {
  const base = pair.baseToken;
  const resolvedMint = base?.address ?? fallbackAddress;
  const info = pair.info;
  const pairSocials = mapSocials(pair);
  const pairWebsites = info?.websites?.map((w) => w.url) ?? [];
  const createdAt = pair.pairCreatedAt ?? null;
  const pairAgeHours =
    createdAt != null
      ? Math.max(0, (Date.now() - createdAt) / (1000 * 60 * 60))
      : null;
  const txns24h =
    (pair.txns?.h24?.buys ?? 0) + (pair.txns?.h24?.sells ?? 0);

  const market: OracleMarketData = {
    priceUsd: Number(pair.priceUsd ?? 0),
    marketCapUsd: pair.marketCap ?? pair.fdv ?? 0,
    fdvUsd: pair.fdv ?? pair.marketCap ?? 0,
    liquidityUsd: pair.liquidity?.usd ?? 0,
    volume24hUsd: pair.volume?.h24 ?? 0,
    priceChange24h: pair.priceChange?.h24 ?? 0,
    priceChange1h: pair.priceChange?.h1 ?? 0,
    pairAddress: pair.pairAddress ?? "",
    dexId: pair.dexId ?? "unknown",
    pairCreatedAt: createdAt,
    pairAgeHours,
    txns24h,
    boostsActive: pair.boosts?.active ?? 0,
  };

  return {
    resolvedMint,
    market,
    symbol: base?.symbol ?? "???",
    name: base?.name ?? "Unknown Token",
    imageUrl: info?.imageUrl,
    description: undefined as string | undefined,
    socials: pairSocials,
    websites: pairWebsites,
  };
}

async function fetchTokenPairs(address: string): Promise<DexPair | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { pairs?: DexPair[] };
    return pickBestSolanaPair(data.pairs ?? []);
  } catch {
    return null;
  }
}

async function fetchPairByAddress(address: string): Promise<DexPair | null> {
  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/pairs/solana/${address}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      pair?: DexPair;
      pairs?: DexPair[];
    };
    return data.pair ?? data.pairs?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchDexScreenerMarket(address: string): Promise<{
  resolvedMint: string;
  market: OracleMarketData | null;
  symbol: string;
  name: string;
  imageUrl?: string;
  description?: string;
  socials: { platform: string; handle: string; url: string }[];
  websites: string[];
}> {
  const candidates = [address, address.toLowerCase()].filter(
    (v, i, a) => a.indexOf(v) === i
  );

  for (const candidate of candidates) {
    const fromToken = await fetchTokenPairs(candidate);
    if (fromToken) return pairToResult(fromToken, candidate);

    const fromPair = await fetchPairByAddress(candidate);
    if (fromPair) return pairToResult(fromPair, candidate);
  }

  return {
    resolvedMint: address,
    market: null,
    symbol: "???",
    name: "Unknown",
    socials: [],
    websites: [],
  };
}
