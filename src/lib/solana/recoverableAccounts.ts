import {
  burnableToEmptyAccount,
  type EmptyTokenAccount,
  type ScanResult,
} from "./scanEmptyAccounts";

export interface RecoverableBreakdown {
  emptyAccounts: EmptyTokenAccount[];
  burnAccounts: EmptyTokenAccount[];
  allAccounts: EmptyTokenAccount[];
  emptyRentLamports: number;
  burnRentLamports: number;
  totalRentLamports: number;
  emptyCount: number;
  burnCount: number;
  totalCount: number;
}

/** Empty accounts + junk-token accounts that can be burned and closed. */
export function getRecoverableBreakdown(
  scanResult: ScanResult,
  options?: { includeBurnable?: boolean }
): RecoverableBreakdown {
  const includeBurnable = options?.includeBurnable ?? true;
  const emptyAccounts = [...scanResult.accounts];
  const burnAccounts = includeBurnable
    ? scanResult.burnableAccounts.map(burnableToEmptyAccount)
    : [];

  const allAccounts = [...emptyAccounts, ...burnAccounts];
  const emptyRentLamports = emptyAccounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );
  const burnRentLamports = burnAccounts.reduce(
    (sum, acc) => sum + acc.rentLamports,
    0
  );

  return {
    emptyAccounts,
    burnAccounts,
    allAccounts,
    emptyRentLamports,
    burnRentLamports,
    totalRentLamports: emptyRentLamports + burnRentLamports,
    emptyCount: emptyAccounts.length,
    burnCount: burnAccounts.length,
    totalCount: allAccounts.length,
  };
}

export function hasRecoverableSol(scanResult: ScanResult): boolean {
  return (
    scanResult.accounts.length > 0 || scanResult.burnableAccounts.length > 0
  );
}
