import { getServerConnection, isValidSolanaAddress } from "@/lib/solana/rpc";
import { fetchDexScreenerMarket } from "./fetchMarket";
import { fetchOnChainHolderAnalysis } from "./fetchOnChain";
import { buildSocialMentions, generateOracleVerdict } from "./generateVerdict";
import type { OracleReport } from "./types";

export async function analyzeToken(mint: string): Promise<OracleReport> {
  const connection = getServerConnection();

  const dex = await fetchDexScreenerMarket(mint);
  const onChain = await fetchOnChainHolderAnalysis(
    connection,
    mint,
    dex.market?.pairAddress ?? null,
    dex.market?.pairCreatedAt ?? null
  );

  const socialMentions = buildSocialMentions(
    dex.symbol,
    dex.socials,
    dex.websites
  );

  const { signals, risks, opportunities, verdict } = generateOracleVerdict({
    mint,
    symbol: dex.symbol,
    name: dex.name,
    imageUrl: dex.imageUrl,
    description: dex.description,
    market: dex.market,
    mintRenounced: onChain.mintRenounced,
    freezeRenounced: onChain.freezeRenounced,
    top10Percent: onChain.top10Percent,
    devHoldPercent: onChain.devHoldPercent,
    lpHoldPercent: onChain.lpHoldPercent,
    botLikePercent: onChain.botLikePercent,
    bundlerCount: onChain.bundlerSignals.length,
    socialMentions,
    websites: dex.websites,
  });

  return {
    mint,
    symbol: dex.symbol,
    name: dex.name,
    imageUrl: dex.imageUrl,
    description: dex.description,
    market: dex.market,
    mintAuthority: onChain.mintAuthority,
    freezeAuthority: onChain.freezeAuthority,
    mintRenounced: onChain.mintRenounced,
    freezeRenounced: onChain.freezeRenounced,
    holderCountEstimate: onChain.holderCountEstimate,
    topHolders: onChain.topHolders,
    top10Percent: onChain.top10Percent,
    devHoldPercent: onChain.devHoldPercent,
    lpHoldPercent: onChain.lpHoldPercent,
    botLikePercent: onChain.botLikePercent,
    bundlerSignals: onChain.bundlerSignals,
    socialMentions,
    risks,
    opportunities,
    signals,
    verdict,
    disclaimer:
      "Oracle output is algorithmic speculation for entertainment. Not financial advice. DYOR — memecoins can go to zero.",
    analyzedAt: Date.now(),
  };
}

export function validateMintAddress(mint: string): boolean {
  return isValidSolanaAddress(mint);
}
