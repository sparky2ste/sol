import { Connection, PublicKey } from "@solana/web3.js";

export interface ClaimRecord {
  signature: string;
  wallet: string;
  amountLamports: number;
  timestamp: number | null;
  status: "success";
  kind: ActivityKind;
}

export type ActivityKind = "reclaim" | "burn";

type ParsedTx = NonNullable<Awaited<ReturnType<Connection["getParsedTransaction"]>>>;

type ParsedInstruction = {
  program?: string;
  parsed?: {
    type?: string;
    info?: Record<string, unknown>;
  };
};

function inspectInstructions(
  tx: ParsedTx,
  visit: (ix: ParsedInstruction) => void
): void {
  for (const ix of tx.transaction.message.instructions) {
    if ("parsed" in ix) visit(ix as ParsedInstruction);
  }

  for (const inner of tx.meta?.innerInstructions ?? []) {
    for (const ix of inner.instructions) {
      if ("parsed" in ix) visit(ix as ParsedInstruction);
    }
  }
}

function classifyActivity(tx: ParsedTx): ActivityKind {
  let isBurn = false;

  inspectInstructions(tx, (ix) => {
    const type = ix.parsed?.type;
    if (
      ix.program === "spl-token" &&
      (type === "burn" || type === "burnChecked")
    ) {
      isBurn = true;
    }
  });

  return isBurn ? "burn" : "reclaim";
}

function collectFeeTransfers(tx: ParsedTx, feeWalletStr: string): number {
  let feeLamports = 0;

  inspectInstructions(tx, (ix) => {
    const info = ix.parsed?.info as
      | { destination?: string; lamports?: number | string }
      | undefined;
    if (
      ix.program === "system" &&
      ix.parsed?.type === "transfer" &&
      info?.destination === feeWalletStr
    ) {
      feeLamports += Number(info.lamports ?? 0);
    }
  });

  return feeLamports;
}

interface FeeActivity {
  signature: string;
  wallet: string;
  amountLamports: number;
  timestamp: number | null;
  kind: ActivityKind;
}

function parseFeeActivity(
  tx: ParsedTx,
  signature: string,
  blockTime: number | null | undefined,
  feeWalletStr: string
): FeeActivity | null {
  const feeLamports = collectFeeTransfers(tx, feeWalletStr);
  if (feeLamports <= 0) return null;

  const wallet = tx.transaction.message.accountKeys[0]?.pubkey.toBase58();
  if (!wallet || wallet === feeWalletStr) return null;

  return {
    signature,
    wallet,
    amountLamports: feeLamports * 100,
    timestamp: blockTime ?? null,
    kind: classifyActivity(tx),
  };
}

export async function fetchRecentClaims(
  connection: Connection,
  feeWallet: PublicKey,
  limit: number
): Promise<ClaimRecord[]> {
  return fetchClaimsFromFeeWallet(connection, feeWallet, limit);
}

export interface LeaderboardEntry {
  wallet: string;
  totalLamports: number;
  reclaimLamports: number;
  burnLamports: number;
  reclaimCount: number;
  burnCount: number;
  lastActivityAt: number | null;
}

export type LeaderboardPeriod = "7d" | "30d" | "all";

const PERIOD_SECONDS: Record<Exclude<LeaderboardPeriod, "all">, number> = {
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
};

function scanLimitForPeriod(period: LeaderboardPeriod): number {
  if (period === "7d") return 100;
  if (period === "30d") return 180;
  return 200;
}

function cutoffForPeriod(period: LeaderboardPeriod): number | null {
  if (period === "all") return null;
  return Math.floor(Date.now() / 1000) - PERIOD_SECONDS[period];
}

async function fetchClaimsFromFeeWallet(
  connection: Connection,
  feeWallet: PublicKey,
  limit: number
): Promise<ClaimRecord[]> {
  const feeWalletStr = feeWallet.toBase58();
  const sigs = await connection.getSignaturesForAddress(feeWallet, {
    limit: Math.min(limit * 3, 60),
  });

  if (sigs.length === 0) return [];

  const txs = await connection.getParsedTransactions(
    sigs.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 }
  );

  const claims: ClaimRecord[] = [];

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const sigInfo = sigs[i];
    if (!tx?.meta || tx.meta.err) continue;

    const activity = parseFeeActivity(
      tx,
      sigInfo.signature,
      sigInfo.blockTime ?? tx.blockTime,
      feeWalletStr
    );
    if (!activity) continue;

    claims.push({
      ...activity,
      status: "success",
    });

    if (claims.length >= limit) break;
  }

  return claims;
}

export async function fetchLeaderboard(
  connection: Connection,
  feeWallet: PublicKey,
  topN: number,
  period: LeaderboardPeriod = "all"
): Promise<LeaderboardEntry[]> {
  const feeWalletStr = feeWallet.toBase58();
  const cutoff = cutoffForPeriod(period);
  const sigs = await connection.getSignaturesForAddress(feeWallet, {
    limit: scanLimitForPeriod(period),
  });

  if (sigs.length === 0) return [];

  const txs = await connection.getParsedTransactions(
    sigs.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 }
  );

  const byWallet = new Map<
    string,
    {
      totalLamports: number;
      reclaimLamports: number;
      burnLamports: number;
      reclaimCount: number;
      burnCount: number;
      lastActivityAt: number | null;
    }
  >();

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const sigInfo = sigs[i];
    if (!tx?.meta || tx.meta.err) continue;

    const activity = parseFeeActivity(
      tx,
      sigInfo.signature,
      sigInfo.blockTime ?? tx.blockTime,
      feeWalletStr
    );
    if (!activity) continue;

    if (
      cutoff !== null &&
      (activity.timestamp === null || activity.timestamp < cutoff)
    ) {
      continue;
    }

    const existing = byWallet.get(activity.wallet);
    const isBurn = activity.kind === "burn";

    if (existing) {
      existing.totalLamports += activity.amountLamports;
      if (isBurn) {
        existing.burnLamports += activity.amountLamports;
        existing.burnCount += 1;
      } else {
        existing.reclaimLamports += activity.amountLamports;
        existing.reclaimCount += 1;
      }
      if (
        activity.timestamp &&
        (existing.lastActivityAt === null ||
          activity.timestamp > existing.lastActivityAt)
      ) {
        existing.lastActivityAt = activity.timestamp;
      }
    } else {
      byWallet.set(activity.wallet, {
        totalLamports: activity.amountLamports,
        reclaimLamports: isBurn ? 0 : activity.amountLamports,
        burnLamports: isBurn ? activity.amountLamports : 0,
        reclaimCount: isBurn ? 0 : 1,
        burnCount: isBurn ? 1 : 0,
        lastActivityAt: activity.timestamp,
      });
    }
  }

  return Array.from(byWallet.entries())
    .map(([wallet, stats]) => ({ wallet, ...stats }))
    .sort((a, b) => b.totalLamports - a.totalLamports)
    .slice(0, topN);
}

export interface CommunityActivityStats {
  totalBurnLamports: number;
  burnCount: number;
  totalReclaimLamports: number;
  reclaimCount: number;
}

export async function fetchCommunityBurnStats(
  connection: Connection,
  feeWallet: PublicKey,
  scanLimit = 200
): Promise<{ totalBurnLamports: number; burnCount: number }> {
  const stats = await fetchCommunityActivityStats(connection, feeWallet, scanLimit);
  return {
    totalBurnLamports: stats.totalBurnLamports,
    burnCount: stats.burnCount,
  };
}

export async function fetchCommunityActivityStats(
  connection: Connection,
  feeWallet: PublicKey,
  scanLimit = 200
): Promise<CommunityActivityStats> {
  const feeWalletStr = feeWallet.toBase58();
  const sigs = await connection.getSignaturesForAddress(feeWallet, {
    limit: Math.min(scanLimit, 200),
  });

  let totalBurnLamports = 0;
  let burnCount = 0;
  let totalReclaimLamports = 0;
  let reclaimCount = 0;

  if (sigs.length === 0) {
    return { totalBurnLamports, burnCount, totalReclaimLamports, reclaimCount };
  }

  const txs = await connection.getParsedTransactions(
    sigs.map((s) => s.signature),
    { maxSupportedTransactionVersion: 0 }
  );

  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    const sigInfo = sigs[i];
    if (!tx?.meta || tx.meta.err) continue;

    const activity = parseFeeActivity(
      tx,
      sigInfo.signature,
      sigInfo.blockTime ?? tx.blockTime,
      feeWalletStr
    );
    if (!activity) continue;

    if (activity.kind === "burn") {
      totalBurnLamports += activity.amountLamports;
      burnCount += 1;
    } else {
      totalReclaimLamports += activity.amountLamports;
      reclaimCount += 1;
    }
  }

  return { totalBurnLamports, burnCount, totalReclaimLamports, reclaimCount };
}
