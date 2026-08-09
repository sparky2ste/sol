import { PublicKey } from "@solana/web3.js";
import type {
  EmptyTokenAccount,
  SkippedTokenAccount,
  ScanResult,
} from "./scanEmptyAccounts";

export interface ScanApiResponse {
  wallet: string;
  totalRentLamports: number;
  skippedRentLamports: number;
  accounts: {
    pubkey: string;
    mint: string;
    programId: string;
    rentLamports: number;
    tokenAmount?: string;
    requiresBurn?: boolean;
    decimals?: number;
  }[];
  skippedAccounts: {
    pubkey: string;
    mint: string;
    programId: string;
    rentLamports: number;
    tokenAmount: string;
    uiAmount: number | null;
    label: string;
    reason?: string;
  }[];
}

export interface ScanApiError {
  error: string;
  message: string;
}

export function parseScanApiResponse(data: ScanApiResponse): ScanResult {
  const accounts: EmptyTokenAccount[] = data.accounts.map((account) => ({
    pubkey: new PublicKey(account.pubkey),
    mint: new PublicKey(account.mint),
    programId: new PublicKey(account.programId),
    rentLamports: account.rentLamports,
    tokenAmount: account.tokenAmount,
    requiresBurn: account.requiresBurn,
    decimals: account.decimals,
  }));

  const skippedAccounts: SkippedTokenAccount[] = data.skippedAccounts.map(
    (account) => ({
      pubkey: new PublicKey(account.pubkey),
      mint: new PublicKey(account.mint),
      programId: new PublicKey(account.programId),
      rentLamports: account.rentLamports,
      tokenAmount: account.tokenAmount,
      uiAmount: account.uiAmount,
      label: account.label,
      reason: account.reason,
    })
  );

  return {
    accounts,
    skippedAccounts,
    totalRentLamports: data.totalRentLamports,
    skippedRentLamports: data.skippedRentLamports,
    wallet: new PublicKey(data.wallet),
  };
}

export async function scanWalletViaApi(
  walletAddress: string
): Promise<ScanResult> {
  const response = await fetch(
    `/api/scan?wallet=${encodeURIComponent(walletAddress)}`,
    { cache: "no-store" }
  );

  const data = await response.json();

  if (!response.ok) {
    const err = data as ScanApiError;
    throw new Error(err.message ?? "Failed to scan wallet");
  }

  return parseScanApiResponse(data as ScanApiResponse);
}
