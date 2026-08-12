import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  SendTransactionError,
} from "@solana/web3.js";
import {
  createBurnCheckedInstruction,
  createCloseAccountInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import type { EmptyTokenAccount } from "./scanEmptyAccounts";
import { calculatePlatformFee, calculateAccountNetPayout } from "./constants";

/** Solana packet size limit for legacy transactions */
const MAX_TX_BYTES = 1232;
/** Leave room for blockhash, signatures, and platform-fee transfer */
const TX_SIZE_BUFFER = 200;

/** ~0.00008 SOL per signature — typical Solana network fee */
export const ESTIMATED_NETWORK_FEE_LAMPORTS = 80_000;

export const WALLET_RENT_RESERVE_LAMPORTS = 890_880;

export interface BatchBreakdown {
  index: number;
  accountCount: number;
  reclaimedLamports: number;
  platformFeeLamports: number;
  networkFeeLamports: number;
  youReceiveLamports: number;
}

export interface ReclaimSummary {
  reclaimedLamports: number;
  platformFeeLamports: number;
  networkFeeLamports: number;
  /** Platform + network fees — all deducted from reclaimed SOL, paid by the user */
  totalFeesLamports: number;
  youReceiveLamports: number;
  accountCount: number;
  transactionCount: number;
  batches: BatchBreakdown[];
}

const DUMMY_BLOCKHASH = "11111111111111111111111111111111";

function addCloseInstruction(
  tx: Transaction,
  account: EmptyTokenAccount,
  owner: PublicKey
): void {
  const amount = account.tokenAmount ? BigInt(account.tokenAmount) : BigInt(0);
  if (account.requiresBurn && amount > BigInt(0)) {
    tx.add(
      createBurnCheckedInstruction(
        account.pubkey,
        account.mint,
        owner,
        amount,
        account.decimals ?? 0,
        [],
        account.programId
      )
    );
  }

  tx.add(
    createCloseAccountInstruction(
      account.pubkey,
      owner,
      owner,
      [],
      account.programId
    )
  );
}

async function refreshEmptyAccounts(
  connection: Connection,
  accounts: EmptyTokenAccount[]
): Promise<EmptyTokenAccount[]> {
  const stillEmpty: EmptyTokenAccount[] = [];

  for (const account of accounts) {
    try {
      const onChain = await getAccount(
        connection,
        account.pubkey,
        "confirmed",
        account.programId
      );

      if (onChain.amount === BigInt(0)) {
        stillEmpty.push({
          ...account,
          tokenAmount: "0",
          requiresBurn: false,
        });
        continue;
      }

      if (account.requiresBurn) {
        const mintInfo = await getMint(
          connection,
          account.mint,
          "confirmed",
          account.programId
        );
        stillEmpty.push({
          ...account,
          tokenAmount: onChain.amount.toString(),
          decimals: mintInfo.decimals,
          requiresBurn: true,
        });
      }
    } catch {
      // Account may have been closed already.
    }
  }

  return stillEmpty;
}

function estimateTxSize(tx: Transaction, feePayer: PublicKey): number {
  const probe = new Transaction();
  probe.feePayer = feePayer;
  probe.recentBlockhash = DUMMY_BLOCKHASH;
  for (const instruction of tx.instructions) {
    probe.add(instruction);
  }

  try {
    return probe.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).length;
  } catch {
    return MAX_TX_BYTES + 1;
  }
}

/** Pack as many close instructions as possible into each transaction. */
function packAccountBatches(
  accounts: EmptyTokenAccount[],
  owner: PublicKey
): EmptyTokenAccount[][] {
  if (accounts.length === 0) return [];

  const batches: EmptyTokenAccount[][] = [];
  let index = 0;

  while (index < accounts.length) {
    const batch: EmptyTokenAccount[] = [];
    const tx = new Transaction();
    tx.feePayer = owner;

    while (index < accounts.length) {
      const account = accounts[index];
      const ixBefore = tx.instructions.length;
      addCloseInstruction(tx, account, owner);

      if (estimateTxSize(tx, owner) > MAX_TX_BYTES - TX_SIZE_BUFFER) {
        tx.instructions.splice(ixBefore);
        break;
      }

      batch.push(account);
      index++;
    }

    if (batch.length === 0) {
      throw new Error(
        "Could not fit any close instructions into a transaction."
      );
    }

    batches.push(batch);
  }

  return batches;
}

export function buildBatchBreakdowns(
  accountBatches: EmptyTokenAccount[][]
): BatchBreakdown[] {
  return accountBatches.map((batch, index) => {
    const reclaimedLamports = batch.reduce(
      (sum, acc) => sum + acc.rentLamports,
      0
    );
    const platformFeeLamports = batch.reduce(
      (sum, acc) => sum + calculatePlatformFee(acc.rentLamports),
      0
    );
    const networkFeeLamports = ESTIMATED_NETWORK_FEE_LAMPORTS;
    const youReceiveLamports =
      batch.reduce(
        (sum, acc) => sum + calculateAccountNetPayout(acc.rentLamports),
        0
      ) - networkFeeLamports;

    return {
      index: index + 1,
      accountCount: batch.length,
      reclaimedLamports,
      platformFeeLamports,
      networkFeeLamports,
      youReceiveLamports,
    };
  });
}

export function buildReclaimSummary(
  accounts: EmptyTokenAccount[],
  owner: PublicKey
): ReclaimSummary {
  const accountBatches = packAccountBatches(accounts, owner);
  const reclaimedLamports = accounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );
  const platformFeeLamports = accounts.reduce(
    (sum, acc) => sum + calculatePlatformFee(acc.rentLamports),
    0
  );
  const batches = buildBatchBreakdowns(accountBatches);
  const networkFeeLamports = batches.reduce(
    (sum, b) => sum + b.networkFeeLamports,
    0
  );
  const youReceiveLamports = batches.reduce(
    (sum, b) => sum + b.youReceiveLamports,
    0
  );

  return {
    reclaimedLamports,
    platformFeeLamports,
    networkFeeLamports,
    totalFeesLamports: platformFeeLamports + networkFeeLamports,
    youReceiveLamports,
    accountCount: accounts.length,
    transactionCount: accountBatches.length,
    batches,
  };
}

export async function buildReclaimTransactions(
  accounts: EmptyTokenAccount[],
  owner: PublicKey,
  feeWallet: PublicKey,
  connection?: Connection
): Promise<{ transactions: Transaction[]; summary: ReclaimSummary }> {
  const readyAccounts = connection
    ? await refreshEmptyAccounts(connection, accounts)
    : accounts;
  const summary = buildReclaimSummary(readyAccounts, owner);
  const accountBatches = packAccountBatches(readyAccounts, owner);
  const transactions: Transaction[] = [];

  for (const batch of accountBatches) {
    const tx = new Transaction();
    const batchPlatformFee = batch.reduce(
      (sum, acc) => sum + calculatePlatformFee(acc.rentLamports),
      0
    );

    for (const account of batch) {
      addCloseInstruction(tx, account, owner);
    }

    if (batchPlatformFee > 0) {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: feeWallet,
          lamports: batchPlatformFee,
        })
      );
    }

    tx.feePayer = owner;
    transactions.push(tx);
  }

  return { transactions, summary };
}

export function isWalletUserRejection(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const name = "name" in err ? String(err.name) : "";
  const message =
    "message" in err && typeof err.message === "string" ? err.message : "";
  return (
    name === "WalletSignTransactionError" ||
    /user rejected|rejected the request|transaction cancelled|transaction canceled|request rejected|denied|4001|no sol was moved/i.test(
      message
    )
  );
}

export function formatTransactionError(err: unknown): string {
  if (isWalletUserRejection(err)) {
    return "Transaction cancelled in your wallet. No SOL was moved.";
  }
  if (err instanceof SendTransactionError) {
    const logs = err.logs?.join("\n") ?? "";
    if (logs.includes("insufficient funds for rent")) {
      return "Reclaim amount too small to cover network fees. Try closing more accounts at once.";
    }
    if (logs.includes("insufficient lamports")) {
      return "Reclaim amount too small after fees. You need more empty accounts to reclaim.";
    }
    return err.message;
  }
  if (err instanceof Error) {
    if (err.message.includes("insufficient funds for rent")) {
      return "Reclaim amount too small to cover network fees. Try closing more accounts at once.";
    }
    return err.message;
  }
  return "Transaction failed";
}

export async function sendReclaimTransactions(
  connection: Connection,
  transactions: Transaction[],
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  onProgress?: (current: number, total: number) => void,
  signAllTransactions?: (
    txs: Transaction[]
  ) => Promise<Transaction[]>
): Promise<string[]> {
  if (transactions.length === 0) return [];

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  for (const tx of transactions) {
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
  }

  let signedTransactions: Transaction[];

  try {
    signedTransactions = signAllTransactions
      ? await signAllTransactions(transactions)
      : await Promise.all(transactions.map((tx) => signTransaction(tx)));
  } catch (err) {
    throw new Error(formatTransactionError(err));
  }

  const signatures: string[] = [];

  for (let i = 0; i < signedTransactions.length; i++) {
    onProgress?.(i + 1, signedTransactions.length);

    try {
      const signature = await connection.sendRawTransaction(
        signedTransactions[i].serialize(),
        {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        }
      );

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      signatures.push(signature);
    } catch (err) {
      throw new Error(formatTransactionError(err));
    }
  }

  return signatures;
}
