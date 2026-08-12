import { Connection, PublicKey } from "@solana/web3.js";
import { getMint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@/lib/solana/constants";
import { fetchHeliusHoldersByMint } from "./fetchHeliusHolders";
import { withRpcRetry } from "./rpcRetry";
import type { OracleBundlerSignal, OracleHolderWallet } from "./types";

const TOP_WALLET_SCAN = 50;
const MAX_BUNDLER_SIGNALS = 20;
const MAX_SIG_CHECKS = 18;
const LOW_SOL_LAMPORTS = 100_000_000;
const SNIPER_SOL_LAMPORTS = 50_000_000;
const EARLY_BUY_WINDOW_MS = 20 * 60 * 1000;

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

interface WalletRow {
  address: string;
  amount: number;
  uiAmount: number;
  percent: number;
}

function amountClusterKey(uiAmount: number): string {
  if (uiAmount >= 1_000_000) return uiAmount.toFixed(0);
  if (uiAmount >= 10_000) return uiAmount.toFixed(1);
  if (uiAmount >= 100) return uiAmount.toFixed(2);
  if (uiAmount >= 1) return uiAmount.toFixed(4);
  return uiAmount.toFixed(6);
}

function isLpOwner(owner: string, pairAddress: string | null): string | null {
  if (pairAddress && owner === pairAddress) return "LP Pool";
  if (KNOWN_LP_LABELS[owner]) return KNOWN_LP_LABELS[owner];
  if (LP_PROGRAM_HINTS.has(owner)) return "AMM Pool";
  return null;
}

function detectBundlerClusters(
  wallets: WalletRow[]
): Map<string, { reason: string; clusterSize: number }> {
  const flags = new Map<string, { reason: string; clusterSize: number }>();
  const groups = new Map<string, WalletRow[]>();

  for (const w of wallets) {
    if (w.percent < 0.08) continue;
    const key = amountClusterKey(w.uiAmount);
    const group = groups.get(key) ?? [];
    group.push(w);
    groups.set(key, group);
  }

  for (const [key, group] of groups) {
    if (group.length < 3) continue;
    const clusterPct = group.reduce((s, w) => s + w.percent, 0);
    const reason = `Bundler cluster: ${group.length} wallets hold identical ~${key} tokens (~${clusterPct.toFixed(1)}% combined).`;
    for (const w of group) {
      flags.set(w.address, { reason, clusterSize: group.length });
    }
  }

  const sorted = [...wallets].sort((a, b) => a.uiAmount - b.uiAmount);
  for (let i = 0; i < sorted.length; i++) {
    const base = sorted[i];
    if (base.percent < 0.15) continue;
    const near: WalletRow[] = [base];
    for (let j = i + 1; j < sorted.length; j++) {
      const other = sorted[j];
      if (other.uiAmount > base.uiAmount * 1.03) break;
      if (Math.abs(other.uiAmount - base.uiAmount) / base.uiAmount <= 0.02) {
        near.push(other);
      }
    }
    if (near.length >= 3) {
      const clusterPct = near.reduce((s, w) => s + w.percent, 0);
      const reason = `Bundler cluster: ${near.length} wallets with matching buy size (~${clusterPct.toFixed(1)}% combined).`;
      for (const w of near) {
        if (!flags.has(w.address)) {
          flags.set(w.address, { reason, clusterSize: near.length });
        }
      }
    }
  }

  return flags;
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

async function mergeTopHolders(
  connection: Connection,
  mint: PublicKey,
  supply: number,
  decimals: number
): Promise<{ wallets: WalletRow[]; holderCountEstimate: number }> {
  const byOwner = new Map<string, number>();

  const [largest, helius] = await Promise.all([
    withRpcRetry(() => connection.getTokenLargestAccounts(mint, "confirmed")),
    fetchHeliusHoldersByMint(mint.toBase58(), decimals).catch(() => ({
      holders: [] as { owner: string; amount: number; uiAmount: number }[],
      totalAccounts: 0,
    })),
  ]);

  const largestEntries = largest.value.filter(
    (e) => e.address && e.amount != null
  );
  const tokenAccountPubkeys = largestEntries.map((e) => e.address!);
  const accountInfos = tokenAccountPubkeys.length
    ? await withRpcRetry(() =>
        connection.getMultipleAccountsInfo(tokenAccountPubkeys, "confirmed")
      )
    : [];

  largestEntries.forEach((entry, i) => {
    const amount = Number(entry.amount);
    if (amount <= 0) return;

    let owner = entry.address!.toBase58();
    const data = accountInfos[i]?.data;
    if (data && data.length >= 64) {
      try {
        owner = new PublicKey(data.subarray(32, 64)).toBase58();
      } catch {
        // Keep token account address
      }
    }

    byOwner.set(owner, Math.max(byOwner.get(owner) ?? 0, amount));
  });

  for (const h of helius.holders) {
    byOwner.set(h.owner, Math.max(byOwner.get(h.owner) ?? 0, h.amount));
  }

  const wallets = [...byOwner.entries()]
    .map(([address, amount]) => ({
      address,
      amount,
      uiAmount: amount / 10 ** decimals,
      percent: supply > 0 ? (amount / supply) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, TOP_WALLET_SCAN);

  const holderCountEstimate = Math.max(
    helius.totalAccounts,
    helius.holders.length,
    largest.value.length
  );

  return { wallets, holderCountEstimate };
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
  const mintInfo = await withRpcRetry(() =>
    getMint(connection, mint, "confirmed", programId)
  );

  const mintAuthority = mintInfo.mintAuthority?.toBase58() ?? null;
  const freezeAuthority = mintInfo.freezeAuthority?.toBase58() ?? null;
  const mintRenounced = mintAuthority === null;
  const freezeRenounced = freezeAuthority === null;
  const supply = Number(mintInfo.supply);
  const decimals = mintInfo.decimals;

  const { wallets, holderCountEstimate } = await mergeTopHolders(
    connection,
    mint,
    supply,
    decimals
  );

  const walletRows: WalletRow[] = [];
  const topHolders: OracleHolderWallet[] = [];
  let lpHoldPercent = 0;
  let devHoldPercent = 0;

  for (const w of wallets) {
    const lpTag = isLpOwner(w.address, pairAddress);
    const tags: string[] = [];

    if (lpTag) {
      tags.push(lpTag);
      lpHoldPercent += w.percent;
    } else {
      walletRows.push(w);
    }

    if (mintAuthority && w.address === mintAuthority) {
      tags.push("Mint Authority");
      devHoldPercent += w.percent;
    }

    topHolders.push({
      address: w.address,
      percent: w.percent,
      uiAmount: w.uiAmount,
      tags,
    });
  }

  const clusterFlags = detectBundlerClusters(walletRows);
  const bundlerSignals: OracleBundlerSignal[] = [];
  const flaggedAddresses = new Set<string>();

  for (const [address, meta] of clusterFlags) {
    const w = walletRows.find((row) => row.address === address);
    if (!w) continue;
    bundlerSignals.push({
      address,
      percent: w.percent,
      reason: meta.reason,
    });
    flaggedAddresses.add(address);
  }

  let botLikePercent = 0;
  for (const [, meta] of clusterFlags) {
    botLikePercent += meta.clusterSize * 2;
  }
  botLikePercent = Math.min(100, botLikePercent);

  const solCheckTargets = walletRows;
  const balanceResults: number[] = [];
  for (let i = 0; i < solCheckTargets.length; i += 25) {
    const chunk = solCheckTargets
      .slice(i, i + 25)
      .map((w) => new PublicKey(w.address));
    const infos = await withRpcRetry(() =>
      connection.getMultipleAccountsInfo(chunk, "confirmed")
    );
    for (const info of infos) {
      balanceResults.push(info?.lamports ?? 0);
    }
  }

  const sigCandidates: { wallet: WalletRow; score: number }[] = [];

  solCheckTargets.forEach((wallet, index) => {
    const solBalance = balanceResults[index] ?? 0;
    const holder = topHolders.find((h) => h.address === wallet.address);
    if (!holder) return;

    if (solBalance < LOW_SOL_LAMPORTS && wallet.percent >= 0.25) {
      holder.tags.push("Low SOL");
      botLikePercent = Math.min(100, botLikePercent + wallet.percent * 0.25);
      sigCandidates.push({
        wallet,
        score: wallet.percent + (solBalance < SNIPER_SOL_LAMPORTS ? 5 : 2),
      });
    }

    if (
      solBalance < SNIPER_SOL_LAMPORTS &&
      wallet.percent >= 0.8 &&
      !flaggedAddresses.has(wallet.address)
    ) {
      holder.tags.push("Sniper wallet");
      bundlerSignals.push({
        address: wallet.address,
        percent: wallet.percent,
        reason: "Low SOL wallet holding a large bag. Typical sniper/bundler.",
      });
      flaggedAddresses.add(wallet.address);
    }

    if (clusterFlags.has(wallet.address)) {
      holder.tags.push("Bundler");
    }
  });

  sigCandidates.sort((a, b) => b.score - a.score);
  let sigChecks = 0;

  for (const candidate of sigCandidates) {
    if (sigChecks >= MAX_SIG_CHECKS) break;
    if (!pairCreatedAt || candidate.wallet.percent < 0.2) continue;
    if (flaggedAddresses.has(candidate.wallet.address)) continue;

    try {
      const sigs = await connection.getSignaturesForAddress(
        new PublicKey(candidate.wallet.address),
        { limit: 5 }
      );
      sigChecks += 1;
      const oldest = sigs[sigs.length - 1]?.blockTime;
      if (oldest && oldest * 1000 < pairCreatedAt + EARLY_BUY_WINDOW_MS) {
        const holder = topHolders.find(
          (h) => h.address === candidate.wallet.address
        );
        holder?.tags.push("Early buyer");
        bundlerSignals.push({
          address: candidate.wallet.address,
          percent: candidate.wallet.percent,
          reason: "Bought within ~20 min of pool launch. Sniper/bundler.",
        });
        flaggedAddresses.add(candidate.wallet.address);
      }
    } catch {
      // Skip failed signature lookups
    }
  }

  if (devHoldPercent === 0 && mintAuthority) {
    const devWallet = walletRows.find((w) => w.address === mintAuthority);
    if (devWallet) devHoldPercent = devWallet.percent;
  }

  const top10Percent = wallets
    .slice(0, 10)
    .reduce((sum, w) => sum + w.percent, 0);

  bundlerSignals.sort((a, b) => b.percent - a.percent);

  return {
    mintAuthority,
    freezeAuthority,
    mintRenounced,
    freezeRenounced,
    holderCountEstimate,
    topHolders: topHolders.slice(0, 15),
    top10Percent,
    devHoldPercent,
    lpHoldPercent,
    botLikePercent: Math.round(botLikePercent * 10) / 10,
    bundlerSignals: bundlerSignals.slice(0, MAX_BUNDLER_SIGNALS),
  };
}
