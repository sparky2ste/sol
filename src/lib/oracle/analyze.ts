import { Connection, PublicKey } from "@solana/web3.js";
import { getServerConnection, isValidSolanaAddress } from "@/lib/solana/rpc";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from "@/lib/solana/constants";
import { fetchDexScreenerMarket } from "./fetchMarket";
import { fetchOnChainHolderAnalysis } from "./fetchOnChain";
import { buildSocialMentions, generateOracleVerdict } from "./generateVerdict";
import { withRpcRetry } from "./rpcRetry";
import type { OracleReport } from "./types";

async function assertTokenMint(connection: Connection, mint: string): Promise<void> {
  const pubkey = new PublicKey(mint);
  const info = await withRpcRetry(() =>
    connection.getAccountInfo(pubkey, "confirmed")
  );

  if (!info) {
    throw new Error("Address not found on Solana mainnet.");
  }

  const owner = info.owner.toBase58();
  const isMint =
    owner === TOKEN_PROGRAM_ID.toBase58() ||
    owner === TOKEN_2022_PROGRAM_ID.toBase58();

  if (!isMint) {
    throw new Error(
      "That address is not a token mint. Paste the token CA (mint address), not a wallet or pool."
    );
  }
}

export async function analyzeToken(mint: string): Promise<OracleReport> {
  const connection = getServerConnection();
  await assertTokenMint(connection, mint);

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
