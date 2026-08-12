import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import type { OracleBundlerSignal, OracleHolderWallet } from "./types";

const LP_PROGRAM_HINTS = [
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", // Raydium AMM
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", // Raydium CLMM
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA", // PumpSwap
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P", // Pump.fun program
];

const KNOWN_LP_LABELS: Record<string, string> = {
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium LP",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK": "Raydium CLMM",
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc": "Orca LP",
};

function isLikelyLp(owner: string, tags: string[]): boolean {
  if (LP_PROGRAM_HINTS.includes(owner)) return true;
  return tags.some((t) => t.includes("LP") || t.includes("Pool"));
}

async function getWalletSolBalance(
  connection: Connection,
  address: string
): Promise<number> {
  try {
    return await connection.getBalance(new PublicKey(address), "confirmed");
  } catch {
    return 0;
  }
}

function clusterByExactAmount(
  holders: { uiAmount: number; address: string }[]
): Map<number, number> {
  const clusters = new Map<number, number>();
  for (const h of holders) {
    if (h.uiAmount <= 0) continue;
    const key = Math.round(h.uiAmount * 1_000_000) / 1_000_000;
    clusters.set(key, (clusters.get(key) ?? 0) + 1);
  }
  return clusters;
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
  const mintInfo = await getMint(connection, mint, "confirmed");

  const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;
  const mintRenounced = mintAuthority === null;
  const freezeRenounced = freezeAuthority === null;

  const largest = await connection.getTokenLargestAccounts(mint, "confirmed");
  const supply = Number(mintInfo.supply);

  const rawHolders: {
    address: string;
    amount: number;
    uiAmount: number;
    owner: string;
  }[] = [];

  for (const entry of largest.value) {
    if (!entry.address || entry.uiAmount == null) continue;
    try {
      const accountInfo = await connection.getParsedAccountInfo(
        entry.address,
        "confirmed"
      );
      const owner =
        (accountInfo.value?.data as { parsed?: { info?: { owner?: string } } })
          ?.parsed?.info?.owner ?? entry.address.toBase58();

      rawHolders.push({
        address: owner,
        amount: Number(entry.amount),
        uiAmount: entry.uiAmount,
        owner,
      });
    } catch {
      rawHolders.push({
        address: entry.address.toBase58(),
        amount: Number(entry.amount),
        uiAmount: entry.uiAmount,
        owner: entry.address.toBase58(),
      });
    }
  }

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
    } else if (isLikelyLp(h.owner, tags)) {
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

  const clusters = clusterByExactAmount(walletHolders);
  for (const [amount, count] of clusters) {
    if (count >= 3 && amount > 0) {
      botLikePercent += (count / Math.max(walletHolders.length, 1)) * 15;
    }
  }
  botLikePercent = Math.min(100, botLikePercent);

  const top10Percent = rawHolders
    .slice(0, 10)
    .reduce((sum, h) => sum + (supply > 0 ? (h.amount / supply) * 100 : 0), 0);

  for (const wallet of walletHolders.slice(0, 8)) {
    const solBalance = await getWalletSolBalance(connection, wallet.address);
    const tags: string[] = [];

    if (solBalance < 50_000_000 && wallet.percent >= 0.5) {
      tags.push("Low SOL wallet");
      botLikePercent = Math.min(100, botLikePercent + wallet.percent * 0.3);
    }

    if (pairCreatedAt && wallet.percent >= 1) {
      try {
        const sigs = await connection.getSignaturesForAddress(
          new PublicKey(wallet.address),
          { limit: 5 }
        );
        const oldest = sigs[sigs.length - 1]?.blockTime;
        if (
          oldest &&
          oldest * 1000 < pairCreatedAt + 10 * 60 * 1000 &&
          wallet.percent >= 0.8
        ) {
          tags.push("Early buyer");
          bundlerSignals.push({
            address: wallet.address,
            percent: wallet.percent,
            reason: "Bought within ~10 min of pool creation — possible sniper/bundler",
          });
        }
      } catch {
        // Skip signature lookup failures
      }
    }

    const holder = topHolders.find((t) => t.address === wallet.address);
    if (holder) {
      holder.tags.push(...tags);
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
