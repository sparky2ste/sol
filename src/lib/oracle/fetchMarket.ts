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

export async function fetchDexScreenerMarket(
  mint: string
): Promise<{
  market: OracleMarketData | null;
  symbol: string;
  name: string;
  imageUrl?: string;
  description?: string;
  socials: { platform: string; handle: string; url: string }[];
  websites: string[];
}> {
  const res = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
    { next: { revalidate: 0 } }
  );

  if (!res.ok) {
    return {
      market: null,
      symbol: "???",
      name: "Unknown",
      socials: [],
      websites: [],
    };
  }

  const data = (await res.json()) as { pairs?: DexPair[] };
  const pair = pickBestSolanaPair(data.pairs ?? []);

  let profileSocials: { platform: string; handle: string; url: string }[] = [];
  let profileWebsites: string[] = [];
  let description: string | undefined;
  let imageUrl: string | undefined;

  try {
    const profileRes = await fetch(
      "https://api.dexscreener.com/token-profiles/latest/v1",
      { next: { revalidate: 0 } }
    );
    if (profileRes.ok) {
      const profiles = (await profileRes.json()) as Array<{
        chainId?: string;
        tokenAddress?: string;
        description?: string;
        icon?: string;
        links?: Array<{ type?: string; label?: string; url?: string }>;
      }>;
      const profile = profiles.find(
        (p) =>
          p.chainId === "solana" &&
          p.tokenAddress?.toLowerCase() === mint.toLowerCase()
      );
      if (profile) {
        description = profile.description;
        imageUrl = profile.icon;
        for (const link of profile.links ?? []) {
          if (!link.url) continue;
          const type = (link.type ?? link.label ?? "").toLowerCase();
          if (type.includes("twitter") || link.url.includes("x.com")) {
            const handle = link.url.split("/").pop() ?? link.label ?? "twitter";
            profileSocials.push({
              platform: "twitter",
              handle: handle.replace("@", ""),
              url: link.url,
            });
          } else if (type.includes("telegram") || link.url.includes("t.me")) {
            profileSocials.push({
              platform: "telegram",
              handle: link.label ?? "telegram",
              url: link.url,
            });
          } else if (type.includes("website") || link.url.startsWith("http")) {
            profileWebsites.push(link.url);
          }
        }
      }
    }
  } catch {
    // Profile fetch is optional
  }

  if (!pair) {
    return {
      market: null,
      symbol: "???",
      name: "Unknown",
      imageUrl,
      description,
      socials: profileSocials,
      websites: profileWebsites,
    };
  }

  const info = (pair as DexPair & {
    baseToken?: { symbol?: string; name?: string };
    info?: {
      imageUrl?: string;
      websites?: { url: string }[];
      socials?: { platform: string; handle: string }[];
    };
  }).info;

  const base = (pair as DexPair & {
    baseToken?: { symbol?: string; name?: string };
  }).baseToken;

  const pairSocials =
    info?.socials?.map((s) => ({
      platform: s.platform,
      handle: s.handle,
      url:
        s.platform === "twitter"
          ? `https://x.com/${s.handle.replace("@", "")}`
          : s.platform === "telegram"
            ? `https://t.me/${s.handle.replace("@", "")}`
            : `https://${s.platform}.com/${s.handle}`,
    })) ?? [];

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
    market,
    symbol: base?.symbol ?? "???",
    name: base?.name ?? "Unknown Token",
    imageUrl: imageUrl ?? info?.imageUrl,
    description,
    socials: [...profileSocials, ...pairSocials],
    websites: [...new Set([...profileWebsites, ...pairWebsites])],
  };
}
