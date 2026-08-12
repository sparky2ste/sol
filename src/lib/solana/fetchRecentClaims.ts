import { Connection, PublicKey } from "@solana/web3.js";

export interface ClaimRecord {
  signature: string;
  wallet: string;
  amountLamports: number;
  timestamp: number | null;
  status: "success";
}

function collectFeeTransfers(
  tx: NonNullable<Awaited<ReturnType<Connection["getParsedTransaction"]>>>,
  feeWalletStr: string
): number {
  let feeLamports = 0;

  const checkIx = (ix: { program?: string; parsed?: { type?: string; info?: { destination?: string; lamports?: number | string } } }) => {
    if (
      ix.program === "system" &&
      ix.parsed?.type === "transfer" &&
      ix.parsed.info?.destination === feeWalletStr
    ) {
      feeLamports += Number(ix.parsed.info.lamports ?? 0);
    }
  };

  for (const ix of tx.transaction.message.instructions) {
    if ("parsed" in ix) checkIx(ix);
  }

  for (const inner of tx.meta?.innerInstructions ?? []) {
    for (const ix of inner.instructions) {
      if ("parsed" in ix) checkIx(ix);
    }
  }

  return feeLamports;
}

export async function fetchRecentClaims(
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

    const feeLamports = collectFeeTransfers(tx, feeWalletStr);
    if (feeLamports <= 0) continue;

    const feePayer = tx.transaction.message.accountKeys[0]?.pubkey.toBase58();
    if (!feePayer || feePayer === feeWalletStr) continue;

    claims.push({
      signature: sigInfo.signature,
      wallet: feePayer,
      amountLamports: feeLamports * 100,
      timestamp: sigInfo.blockTime ?? tx.blockTime ?? null,
      status: "success",
    });

    if (claims.length >= limit) break;
  }

  return claims;
}
