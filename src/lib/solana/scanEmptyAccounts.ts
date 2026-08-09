import { Connection, PublicKey } from "@solana/web3.js";
import { AccountLayout } from "@solana/spl-token";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  RENT_PER_EMPTY_ACCOUNT_LAMPORTS,
  getKnownMintLabel,
  isProtectedMint,
} from "./constants";

export interface EmptyTokenAccount {
  pubkey: PublicKey;
  mint: PublicKey;
  programId: PublicKey;
  rentLamports: number;
  tokenAmount?: string;
  requiresBurn?: boolean;
  decimals?: number;
}

export interface SkippedTokenAccount {
  pubkey: PublicKey;
  mint: PublicKey;
  programId: PublicKey;
  rentLamports: number;
  tokenAmount: string;
  uiAmount: number | null;
  label: string;
  reason?: string;
}

export interface ScanResult {
  accounts: EmptyTokenAccount[];
  skippedAccounts: SkippedTokenAccount[];
  totalRentLamports: number;
  skippedRentLamports: number;
  wallet: PublicKey;
}

interface ParsedTokenInfo {
  mint: string;
  tokenAmount?: {
    amount?: string;
    uiAmount?: number | null;
    decimals?: number;
  };
  state?: string;
  extensions?: Array<{
    extension: string;
    state?: Record<string, unknown>;
  }>;
}

function hasWithheldTransferFees(info: ParsedTokenInfo): boolean {
  if (!info.extensions?.length) return false;

  for (const ext of info.extensions) {
    if (ext.extension !== "transferFeeAmount") continue;
    const withheld = ext.state?.withheldAmount;
    if (withheld && withheld !== "0" && withheld !== 0) return true;
  }

  return false;
}

function getTokenAmount(info: ParsedTokenInfo): bigint {
  const amount = info.tokenAmount?.amount;
  if (amount === undefined || amount === "") {
    return BigInt(0);
  }
  try {
    return BigInt(amount);
  } catch {
    return BigInt(0);
  }
}

function getSkippedLabel(mint: string): string {
  return getKnownMintLabel(mint) ?? "Token";
}

/** Dust that displays as 0 in wallet UIs — vacant spam, not USDC. */
function isVacantDust(info: ParsedTokenInfo, tokenAmount: bigint): boolean {
  if (tokenAmount === BigInt(0)) return false;
  if (isProtectedMint(info.mint)) return false;

  const uiAmount = info.tokenAmount?.uiAmount;
  if (uiAmount === 0) return true;

  if (uiAmount == null && tokenAmount <= BigInt(1)) return true;

  return false;
}

function toAccountBuffer(data: unknown): Buffer | null {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  return null;
}

function parseRawTokenAccount(data: unknown): {
  mint: PublicKey;
  amount: bigint;
} | null {
  const buffer = toAccountBuffer(data);
  if (!buffer) return null;

  try {
    const decoded = AccountLayout.decode(buffer);
    return { mint: decoded.mint, amount: decoded.amount };
  } catch {
    return null;
  }
}

async function scanProgramAccounts(
  connection: Connection,
  owner: PublicKey,
  programId: PublicKey
): Promise<{
  empty: EmptyTokenAccount[];
  skipped: SkippedTokenAccount[];
}> {
  const response = await connection.getParsedTokenAccountsByOwner(owner, {
    programId,
  });

  const empty: EmptyTokenAccount[] = [];
  const skipped: SkippedTokenAccount[] = [];
  const seen = new Set<string>();

  for (const { pubkey, account } of response.value) {
    seen.add(pubkey.toBase58());
    const rentLamports = account.lamports || RENT_PER_EMPTY_ACCOUNT_LAMPORTS;
    const parsed = account.data.parsed?.info as ParsedTokenInfo | undefined;

    if (parsed) {
      if (parsed.state === "frozen") {
        skipped.push({
          pubkey,
          mint: new PublicKey(parsed.mint),
          programId,
          rentLamports,
          tokenAmount: getTokenAmount(parsed).toString(),
          uiAmount: parsed.tokenAmount?.uiAmount ?? null,
          label: getSkippedLabel(parsed.mint),
          reason: "frozen",
        });
        continue;
      }

      if (hasWithheldTransferFees(parsed)) {
        skipped.push({
          pubkey,
          mint: new PublicKey(parsed.mint),
          programId,
          rentLamports,
          tokenAmount: getTokenAmount(parsed).toString(),
          uiAmount: parsed.tokenAmount?.uiAmount ?? null,
          label: getSkippedLabel(parsed.mint),
          reason: "withheld fees",
        });
        continue;
      }

      const tokenAmount = getTokenAmount(parsed);

      if (tokenAmount === BigInt(0)) {
        empty.push({
          pubkey,
          mint: new PublicKey(parsed.mint),
          programId,
          rentLamports,
        });
        continue;
      }

      if (isVacantDust(parsed, tokenAmount)) {
        empty.push({
          pubkey,
          mint: new PublicKey(parsed.mint),
          programId,
          rentLamports,
          tokenAmount: tokenAmount.toString(),
          requiresBurn: true,
          decimals: parsed.tokenAmount?.decimals,
        });
        continue;
      }

      skipped.push({
        pubkey,
        mint: new PublicKey(parsed.mint),
        programId,
        rentLamports,
        tokenAmount: tokenAmount.toString(),
        uiAmount: parsed.tokenAmount?.uiAmount ?? null,
        label: getSkippedLabel(parsed.mint),
      });
      continue;
    }

    const raw = parseRawTokenAccount(account.data);
    if (!raw) continue;

    if (raw.amount === BigInt(0)) {
      empty.push({
        pubkey,
        mint: raw.mint,
        programId,
        rentLamports,
      });
    } else if (!isProtectedMint(raw.mint.toBase58()) && raw.amount <= BigInt(1)) {
      empty.push({
        pubkey,
        mint: raw.mint,
        programId,
        rentLamports,
        tokenAmount: raw.amount.toString(),
        requiresBurn: true,
      });
    } else {
      skipped.push({
        pubkey,
        mint: raw.mint,
        programId,
        rentLamports,
        tokenAmount: raw.amount.toString(),
        uiAmount: null,
        label: getSkippedLabel(raw.mint.toBase58()),
      });
    }
  }

  const rawResponse = await connection.getTokenAccountsByOwner(owner, {
    programId,
  });

  for (const { pubkey, account } of rawResponse.value) {
    const key = pubkey.toBase58();
    if (seen.has(key)) continue;

    const rentLamports = account.lamports || RENT_PER_EMPTY_ACCOUNT_LAMPORTS;
    const raw = parseRawTokenAccount(account.data);
    if (!raw) continue;

    if (raw.amount === BigInt(0)) {
      empty.push({ pubkey, mint: raw.mint, programId, rentLamports });
    } else if (!isProtectedMint(raw.mint.toBase58()) && raw.amount <= BigInt(1)) {
      empty.push({
        pubkey,
        mint: raw.mint,
        programId,
        rentLamports,
        tokenAmount: raw.amount.toString(),
        requiresBurn: true,
      });
    } else {
      skipped.push({
        pubkey,
        mint: raw.mint,
        programId,
        rentLamports,
        tokenAmount: raw.amount.toString(),
        uiAmount: null,
        label: getSkippedLabel(raw.mint.toBase58()),
      });
    }
  }

  return { empty, skipped };
}

export async function scanEmptyAccounts(
  connection: Connection,
  wallet: PublicKey
): Promise<ScanResult> {
  const [spl, token2022] = await Promise.all([
    scanProgramAccounts(connection, wallet, TOKEN_PROGRAM_ID),
    scanProgramAccounts(connection, wallet, TOKEN_2022_PROGRAM_ID),
  ]);

  const accounts = [...spl.empty, ...token2022.empty];
  const skippedAccounts = [...spl.skipped, ...token2022.skipped];
  const totalRentLamports = accounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );
  const skippedRentLamports = skippedAccounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );

  return {
    accounts,
    skippedAccounts,
    totalRentLamports,
    skippedRentLamports,
    wallet,
  };
}

export async function getWalletSolBalance(
  connection: Connection,
  wallet: PublicKey
): Promise<number> {
  return connection.getBalance(wallet, "confirmed");
}
