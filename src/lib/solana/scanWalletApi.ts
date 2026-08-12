import { PublicKey } from "@solana/web3.js";
import type {
  BurnableTokenAccount,
  EmptyTokenAccount,
  SkippedTokenAccount,
  ScanResult,
} from "./scanEmptyAccounts";

export interface ScanApiResponse {
  wallet: string;
  totalRentLamports: number;
  burnableRentLamports: number;
  skippedRentLamports: number;
  accounts: {
    pubkey: string;
    mint: string;
    programId: string;
    rentLamports: number;
  }[];
  burnableAccounts: {
    pubkey: string;
    mint: string;
    programId: string;
    rentLamports: number;
    tokenAmount: string;
    uiAmount: number | null;
    decimals: number;
    label: string;
  }[];
  protectedAccounts: {
    pubkey: string;
    mint: string;
    programId: string;
    rentLamports: number;
    tokenAmount: string;
    uiAmount: number | null;
    label: string;
    reason?: string;
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

function mapSkipped(
  items: ScanApiResponse["skippedAccounts"]
): SkippedTokenAccount[] {
  return items.map((account) => ({
    pubkey: new PublicKey(account.pubkey),
    mint: new PublicKey(account.mint),
    programId: new PublicKey(account.programId),
    rentLamports: account.rentLamports,
    tokenAmount: account.tokenAmount,
    uiAmount: account.uiAmount,
    label: account.label,
    reason: account.reason,
  }));
}

export function parseScanApiResponse(data: ScanApiResponse): ScanResult {
  const accounts: EmptyTokenAccount[] = data.accounts.map((account) => ({
    pubkey: new PublicKey(account.pubkey),
    mint: new PublicKey(account.mint),
    programId: new PublicKey(account.programId),
    rentLamports: account.rentLamports,
  }));

  const burnableAccounts: BurnableTokenAccount[] = data.burnableAccounts.map(
    (account) => ({
      pubkey: new PublicKey(account.pubkey),
      mint: new PublicKey(account.mint),
      programId: new PublicKey(account.programId),
      rentLamports: account.rentLamports,
      tokenAmount: account.tokenAmount,
      uiAmount: account.uiAmount,
      decimals: account.decimals,
      label: account.label,
    })
  );

  return {
    accounts,
    burnableAccounts,
    protectedAccounts: mapSkipped(data.protectedAccounts ?? []),
    skippedAccounts: mapSkipped(data.skippedAccounts ?? []),
    totalRentLamports: data.totalRentLamports,
    burnableRentLamports: data.burnableRentLamports ?? 0,
    skippedRentLamports: data.skippedRentLamports,
    wallet: new PublicKey(data.wallet),
  };
}

export async function scanWalletViaApi(
  walletAddress: string,
  turnstileToken?: string
): Promise<ScanResult> {
  const headers: Record<string, string> = {};
  if (turnstileToken) {
    headers["cf-turnstile-response"] = turnstileToken;
  }

  const response = await fetch(
    `/api/scan?wallet=${encodeURIComponent(walletAddress)}`,
    {
      cache: "no-store",
      credentials: "same-origin",
      headers,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const err = data as ScanApiError;
    const error = new Error(err.message ?? "Failed to scan wallet") as Error & {
      code?: string;
    };
    error.code = err.error;
    throw error;
  }

  return parseScanApiResponse(data as ScanApiResponse);
}
