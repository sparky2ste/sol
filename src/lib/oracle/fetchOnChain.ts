import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";
import { withRpcRetry } from "./rpcRetry";
import type { OracleBundlerSignal, OracleHolderWallet } from "./types";

const LP_PROGRAM_HINTS = new Set([
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
]);

const KNOWN_LP_LABELS: Record<string, string> = {
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium LP",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": "Raydium CLMM",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca LP",
};

function clusterByExactAmount(
  holders: { uiAmount: number }[]
): Map<number, number> {
  const clusters = new Map<number, number>();
  for (const h of holders) {
    if (h.uiAmount <= 0) continue;
    const key = Math.round(h.uiAmount * 1_000_000) / 1_000_000;
    clusters.set(key, (clusters.get(key) ?? 0) + 1);
  }
  return clusters;
}

async function getMintProgramId(
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  const info = await withRpcRetry(() =>
    connection.getAccountInfo(mint, "confirmed")
  );
  if (!info) {
    throw new Error("Address not found on Solana mainnet.");
  }
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) {
    return TOKEN_2022_PROGRAM_ID;
  }
  if (info.owner.equals(TOKEN_PROGRAM_ID)) {
    return TOKEN_PROGRAM_ID;
  }
  throw new Error(
    "That address is not a token mint. Paste the token CA (mint address), not a wallet or pool."
  );
}

export async function fetchOnChainHolderAnalysis(
  connection: Connection,
  mintAddress: string,
  pairAddress: string | null,
  pairCreatedAt: number | null
): Promise<{
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
}> {
  const mint = new PublicKey(mintAddress);
  const programId = await getMintProgramId(connection, mint);
  const [mintInfo, largest] = await Promise.all([
    withRpcRetry(() => getMint(connection, mint, "confirmed", programId)),
    withRpcRetry(() =>
      connection.getTokenLargestAccounts(mint, "confirmed")
    ),
  ]);

  const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;
  const mintRenounced = mintAuthority === null;
  const freezeRenounced = freezeAuthority === null;
  const supply = Number(mintInfo.supply);

  const tokenAccountPubkeys = largest.value
    .filter((e) => e.address && e.uiAmount != null)
    .map((e) => e.address!)
    .slice(0, 12);

  const accountInfos = tokenAccountPubkeys.length
    ? await withRpcRetry(() =>
        connection.getMultipleAccountsInfo(tokenAccountPubkeys, "confirmed")
      )
    : [];

  const rawHolders: {
    address: string;
    amount: number;
    uiAmount: number;
    owner: string;
  }[] = [];

  largest.value.slice(0, 12).forEach((entry, i) => {
    if (!entry.address || entry.uiAmount == null) return;

    let owner = entry.address.toBase58();
    const data = accountInfos[i]?.data;
    if (data && data.length >= 64) {
      try {
        owner = new PublicKey(data.subarray(32, 64)).toBase58();
      } catch {
        // Keep token account address as fallback
      }
    }

    rawHolders.push({
      address: owner,
      amount: Number(entry.amount),
      uiAmount: entry.uiAmount,
      owner,
    });
  });

  const holderCountEstimate = Math.max(rawHolders.length, largest.value.length);
  const topHolders: OracleHolderWallet[] = [];
  let lpHoldPercent = 0;
  let devHoldPercent = 0;
  let botLikePercent = 0;
  const bundlerSignals: OracleBundlerSignal[] = [];
  const walletHolders: { address: string; uiAmount: number; percent: number }[] =
    [];

  for (const h of rawHolders) {
    const percent = supply > 0 ? (h.amount / supply) * 100 : 0;
    const tags: string[] = [];

    if (pairAddress && h.owner === pairAddress) {
      tags.push("LP Pool");
      lpHoldPercent += percent;
    } else if (KNOWN_LP_LABELS[h.owner]) {
      tags.push(KNOWN_LP_LABELS[h.owner]);
      lpHoldPercent += percent;
    } else if (LP_PROGRAM_HINTS.has(h.owner)) {
      tags.push("AMM Pool");
      lpHoldPercent += percent;
    } else {
      walletHolders.push({
        address: h.address,
        uiAmount: h.uiAmount,
        percent,
      });
    }

    if (mintAuthority && h.address === mintAuthority) {
      tags.push("Mint Authority");
      devHoldPercent += percent;
    }

    topHolders.push({
      address: h.address,
      percent,
      uiAmount: h.uiAmount,
      tags,
    });
  }

  for (const [, count] of clusterByExactAmount(walletHolders)) {
    if (count >= 3) {
      botLikePercent += (count / Math.max(walletHolders.length, 1)) * 15;
    }
  }
  botLikePercent = Math.min(100, botLikePercent);

  const top10Percent = rawHolders
    .slice(0, 10)
    .reduce((sum, h) => sum + (supply > 0 ? (h.amount / supply) * 100 : 0), 0);

  const bundlerCandidates = walletHolders
    .filter((w) => w.percent >= 0.8)
    .slice(0, 2);

  if (bundlerCandidates.length > 0) {
    const balances = await connection.getMultipleAccountsInfo(
      bundlerCandidates.map((w) => new PublicKey(w.address)),
      "confirmed"
    );

    for (let i = 0; i < bundlerCandidates.length; i++) {
      const wallet = bundlerCandidates[i];
      const solBalance = balances[i]?.lamports ?? 0;
      const tags: string[] = [];

      if (solBalance < 50_000_000 && wallet.percent >= 0.5) {
        tags.push("Low SOL wallet");
        botLikePercent = Math.min(100, botLikePercent + wallet.percent * 0.3);
      }

      if (pairCreatedAt && wallet.percent >= 1) {
        try {
          const sigs = await connection.getSignaturesForAddress(
            new PublicKey(wallet.address),
            { limit: 3 }
          );
          const oldest = sigs[sigs.length - 1]?.blockTime;
          if (
            oldest &&
            oldest * 1000 < pairCreatedAt + 10 * 60 * 1000
          ) {
            tags.push("Early buyer");
            bundlerSignals.push({
              address: wallet.address,
              percent: wallet.percent,
              reason:
                "Bought within ~10 min of pool creation — possible sniper/bundler",
            });
          }
        } catch {
          // Skip signature lookup failures
        }
      }

      const holder = topHolders.find((t) => t.address === wallet.address);
      if (holder) holder.tags.push(...tags);
    }
  }

  if (devHoldPercent === 0 && mintAuthority) {
    for (const w of walletHolders) {
      if (w.address === mintAuthority) {
        devHoldPercent = w.percent;
        break;
      }
    }
  }

  return {
    mintAuthority,
    freezeAuthority,
    mintRenounced,
    freezeRenounced,
    holderCountEstimate,
    topHolders: topHolders.slice(0, 12),
    top10Percent,
    devHoldPercent,
    lpHoldPercent,
    botLikePercent: Math.round(botLikePercent * 10) / 10,
    bundlerSignals: bundlerSignals.slice(0, 6),
  };
}
