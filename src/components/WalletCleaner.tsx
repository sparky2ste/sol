"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import type { ScanResult } from "@/lib/solana/scanEmptyAccounts";
import { scanWalletViaApi } from "@/lib/solana/scanWalletApi";
import {
  buildReclaimSummary,
  buildReclaimTransactions,
  sendReclaimTransactions,
  WALLET_RENT_RESERVE_LAMPORTS,
} from "@/lib/solana/buildReclaimTransaction";
import {
  formatSol,
  getFeeWallet,
  truncateAddress,
} from "@/lib/solana/constants";

export function WalletCleaner() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet();

  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimProgress, setClaimProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);
  const [rpcConfigured, setRpcConfigured] = useState<boolean | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const feeWallet = useMemo(() => getFeeWallet(), []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setRpcConfigured(d.rpcConfigured))
      .catch(() => setRpcConfigured(false));
  }, []);

  const summary = useMemo(() => {
    if (!scanResult?.accounts.length || !publicKey) return null;
    return buildReclaimSummary(scanResult.accounts, publicKey);
  }, [scanResult, publicKey]);

  const scanWallet = useCallback(async () => {
    if (!publicKey || !rpcConfigured) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await scanWalletViaApi(publicKey.toBase58());
      setScanResult(result);
      const balance = await connection.getBalance(publicKey, "confirmed");
      setWalletBalance(balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan wallet");
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  }, [publicKey, rpcConfigured, connection]);

  useEffect(() => {
    if (!connected || !publicKey) {
      setScanResult(null);
      setSuccess(null);
      setError(null);
      return;
    }
    if (rpcConfigured) {
      scanWallet();
    }
  }, [connected, publicKey, rpcConfigured, scanWallet]);

  const handleClaim = async () => {
    if (!publicKey || !signTransaction || !scanResult?.accounts.length) return;

    if (!feeWallet) {
      setError(
        "Fee wallet not configured. Set NEXT_PUBLIC_FEE_WALLET in .env.local."
      );
      return;
    }

    if (summary && summary.youReceiveLamports <= 0) {
      setError(
        "Reclaim amount too small after fees are taken from your SOL. Need more empty accounts."
      );
      return;
    }

    setClaiming(true);
    setClaimProgress(null);
    setError(null);
    setSuccess(null);

    try {
      const { transactions } = await buildReclaimTransactions(
        scanResult.accounts,
        publicKey,
        feeWallet,
        connection
      );

      const signatures = await sendReclaimTransactions(
        connection,
        transactions,
        signTransaction,
        (current, total) => setClaimProgress({ current, total }),
        signAllTransactions ?? undefined
      );

      setSuccess(signatures);
      await scanWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setClaiming(false);
      setClaimProgress(null);
    }
  };

  if (!connected) {
    return (
      <div className="text-center py-10 sm:py-14">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-400/10 border border-accent-400/20 mb-6">
          <svg
            className="w-8 h-8 text-accent-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold mb-3">
          Connect your wallet
        </h3>
        <p className="text-surface-muted max-w-md mx-auto mb-8 leading-relaxed">
          Link Phantom or Solflare to scan for empty token accounts and reclaim
          locked SOL. Fully non-custodial.
        </p>
        <ConnectWallet layout="stack" />
        <p className="text-xs text-surface-muted/70 mt-6 max-w-sm mx-auto leading-relaxed">
          On mobile, tap <strong className="text-surface-muted">Open in Phantom</strong>{" "}
          to use the in-app browser. We never ask for your seed phrase.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {rpcConfigured === false && <RpcSetupBanner />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-overlay/50 border border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-xs font-bold text-[#06060a]">
            {publicKey?.toBase58().slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-surface-muted">Connected wallet</p>
            <p className="font-mono text-sm text-brand-400">
              {publicKey ? truncateAddress(publicKey.toBase58(), 8) : "—"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={scanWallet}
          disabled={loading || !rpcConfigured}
          className="btn-secondary disabled:opacity-40"
        >
          {loading ? (
            <>
              <Spinner />
              Scanning…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rescan
            </>
          )}
        </button>
      </div>

      {error && <Alert type="error" message={error} />}
      {success && <SuccessAlert signatures={success} />}

      {walletBalance !== null &&
        walletBalance < WALLET_RENT_RESERVE_LAMPORTS &&
        scanResult &&
        scanResult.accounts.length > 0 &&
        summary &&
        summary.youReceiveLamports > 0 && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-500/25 bg-blue-500/8 p-4 text-sm text-blue-200/90">
            <svg className="w-5 h-5 shrink-0 mt-0.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              No SOL in wallet? That&apos;s fine. All fees are taken from your reclaimed SOL, never charged on top.
            </p>
          </div>
        )}

      {loading && !scanResult ? (
        <LoadingState />
      ) : scanResult ? (
        <>
          <UnclaimedSolCard
            scanResult={scanResult}
            summary={summary}
            loading={loading}
            onRescan={scanWallet}
            rpcConfigured={!!rpcConfigured}
          />

          {scanResult.accounts.length === 0 ? (
            <>
              {scanResult.skippedAccounts.length === 0 ? (
                <EmptyState />
              ) : (
                <SkippedAccountsCard scanResult={scanResult} />
              )}
            </>
          ) : (
            <>
              {summary && <BreakdownCard summary={summary} />}

              {claiming && claimProgress && summary && summary.transactionCount > 1 && (
                <ClaimProgressBanner
                  progress={claimProgress}
                  totalReceiveLamports={summary.youReceiveLamports}
                />
              )}

              <button
                type="button"
                onClick={handleClaim}
                disabled={claiming || !feeWallet || !rpcConfigured}
                className="btn-primary w-full py-4 text-base rounded-2xl"
              >
                {claiming ? (
                  <>
                    <Spinner dark />
                    {claimProgress
                      ? `Sending ${claimProgress.current} of ${claimProgress.total}…`
                      : summary && summary.transactionCount > 1
                        ? "Approve all in wallet…"
                        : "Confirm in wallet…"}
                  </>
                ) : (
                  <>
                    Claim SOL
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              {!feeWallet && (
                <p className="text-center text-xs text-amber-400/90">
                  Set NEXT_PUBLIC_FEE_WALLET in .env.local to enable claiming.
                </p>
              )}

              <p className="text-center text-xs text-surface-muted/70">
                Only vacant accounts are closed. USDC and active tokens are never
                touched.
              </p>
            </>
          )}

          {scanResult.accounts.length > 0 &&
            scanResult.skippedAccounts.length > 0 && (
              <SkippedAccountsCard scanResult={scanResult} compact />
            )}
        </>
      ) : rpcConfigured === false ? (
        <div className="text-center py-8 text-surface-muted text-sm">
          Configure Helius API key above to enable wallet scanning.
        </div>
      ) : null}
    </div>
  );
}

function RpcSetupBanner() {
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  if (!isLocalDev) {
    return (
      <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-5 text-sm">
        <p className="font-semibold text-amber-200">Scanner temporarily unavailable</p>
        <p className="text-amber-200/70 mt-1 leading-relaxed">
          Please try again in a few minutes. If this persists, the site operator
          needs to configure server RPC credentials.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 p-5 text-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-amber-200">Helius API key required</p>
          <p className="text-amber-200/70 mt-1 leading-relaxed">
            Get a free key at{" "}
            <a href="https://helius.dev" target="_blank" rel="noopener noreferrer" className="underline text-amber-100 hover:text-white">
              helius.dev
            </a>
            , add to <code className="px-1.5 py-0.5 rounded bg-black/30 text-amber-100">.env.local</code>, then restart the dev server.
          </p>
        </div>
      </div>
      <pre className="bg-black/30 rounded-lg p-3 text-xs font-mono text-surface-muted overflow-x-auto">
        HELIUS_API_KEY=your_key_here
      </pre>
    </div>
  );
}

function Alert({ type, message }: { type: "error"; message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/8 p-4 text-sm text-red-300">
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

function SuccessAlert({ signatures }: { signatures: string[] }) {
  return (
    <div className="rounded-xl border border-brand-400/25 bg-brand-400/8 p-4 text-sm space-y-2">
      <div className="flex items-center gap-2 text-brand-400 font-semibold">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        SOL reclaimed successfully
      </div>
      {signatures.map((sig) => (
        <a
          key={sig}
          href={`https://solscan.io/tx/${sig}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block font-mono text-xs text-surface-muted hover:text-brand-400 transition-colors"
        >
          View on Solscan → {truncateAddress(sig, 8)}
        </a>
      ))}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-14">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-2 border-accent-400/30 border-t-accent-400 animate-spin mb-4" />
      <p className="text-surface-muted">Scanning wallet for empty accounts…</p>
    </div>
  );
}

function UnclaimedSolCard({
  scanResult,
  summary,
  loading,
  onRescan,
  rpcConfigured,
}: {
  scanResult: ScanResult;
  summary: ReturnType<typeof buildReclaimSummary> | null;
  loading: boolean;
  onRescan: () => void;
  rpcConfigured: boolean;
}) {
  const youReceive = summary?.youReceiveLamports ?? 0;
  const canClaim = scanResult.accounts.length > 0 && youReceive > 0;

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-surface-overlay/40 p-8 sm:p-10 text-center overflow-hidden">
      <button
        type="button"
        onClick={onRescan}
        disabled={loading || !rpcConfigured}
        className="absolute top-4 right-4 p-2 rounded-lg text-surface-muted hover:text-white hover:bg-white/[0.06] disabled:opacity-40 transition-colors"
        aria-label="Rescan wallet"
      >
        <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      <p className="text-xs font-medium uppercase tracking-[0.2em] text-surface-muted mb-3">
        Unclaimed SOL
      </p>
      <p className="font-display text-4xl sm:text-5xl font-bold text-white mb-2">
        {formatSol(youReceive)}{" "}
        <span className="text-2xl sm:text-3xl text-brand-400">SOL</span>
      </p>
      <p className="text-sm text-surface-muted mb-1">
        {scanResult.accounts.length} vacant account
        {scanResult.accounts.length === 1 ? "" : "s"}
        {scanResult.totalRentLamports > 0 && (
          <> · {formatSol(scanResult.totalRentLamports)} SOL locked</>
        )}
      </p>
      {canClaim && (
        <p className="text-xs text-surface-muted/80">
          After 1% platform fee and network fees
        </p>
      )}
      {!canClaim && scanResult.skippedAccounts.length > 0 && (
        <p className="text-xs text-blue-300/90 mt-3 max-w-md mx-auto">
          {formatSol(scanResult.skippedRentLamports)} SOL locked in accounts
          that still hold tokens. Send them out first, then rescan.
        </p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 rounded-xl bg-surface-overlay/30 border border-white/[0.04]">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-400/10 mb-3">
        <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="font-display text-base font-semibold mb-1">Nothing to claim</p>
      <p className="text-sm text-surface-muted">
        No vacant token accounts on-chain right now.
      </p>
    </div>
  );
}

function SkippedAccountsCard({
  scanResult,
  compact,
}: {
  scanResult: ScanResult;
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border border-blue-500/25 bg-blue-500/8 p-5 space-y-3 text-sm">
      <p className="font-semibold text-blue-200">
        {compact ? "Skipped (not empty)" : "Accounts with balances"}{" "}
        {!compact && `(${formatSol(scanResult.skippedRentLamports)} SOL locked)`}
      </p>
      {!compact && (
        <p className="text-blue-200/80 leading-relaxed">
          These still hold tokens like USDC. We never burn or sell them. Send
          the balance out in Phantom, then hit <strong>Rescan</strong> to claim
          the rent once the account is empty.
        </p>
      )}
      <div className="space-y-2">
        {scanResult.skippedAccounts.map((account, i) => (
          <div
            key={i}
            className="flex justify-between text-xs text-blue-100/90 rounded-lg bg-black/20 px-3 py-2"
          >
            <span>{account.label}</span>
            <span className="font-mono">
              {account.uiAmount ?? "?"} · ~{formatSol(account.rentLamports)} SOL rent
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClaimProgressBanner({
  progress,
  totalReceiveLamports,
}: {
  progress: { current: number; total: number };
  totalReceiveLamports: number;
}) {
  return (
    <div className="rounded-xl border border-accent-400/30 bg-accent-400/10 p-4 text-sm space-y-2">
      <p className="font-semibold text-accent-300">
        Sending transaction {progress.current} of {progress.total}
      </p>
      <p className="text-surface-muted leading-relaxed">
        You already approved everything in Phantom. Total payout:{" "}
        <span className="text-white font-mono">
          ~{formatSol(totalReceiveLamports)} SOL
        </span>
        .
      </p>
    </div>
  );
}

function BreakdownCard({
  summary,
}: {
  summary: {
    reclaimedLamports: number;
    platformFeeLamports: number;
    networkFeeLamports: number;
    youReceiveLamports: number;
    accountCount: number;
    transactionCount: number;
    batches: Array<{
      index: number;
      accountCount: number;
      youReceiveLamports: number;
    }>;
  };
}) {
  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="font-display font-semibold">Payout breakdown</h3>
      <div className="space-y-2.5 text-sm">
        <Row label="Total reclaimed" value={`${formatSol(summary.reclaimedLamports)} SOL`} />
        <Row
          label="1% platform fee"
          value={`−${formatSol(summary.platformFeeLamports)} SOL`}
          muted
        />
        <Row
          label={
            summary.transactionCount > 1
              ? `Network fees (${summary.transactionCount} transactions)`
              : "Network fee"
          }
          value={`−${formatSol(summary.networkFeeLamports)} SOL`}
          muted
        />
        <div className="border-t border-white/[0.06] pt-3">
          <Row label="You receive" value={`${formatSol(summary.youReceiveLamports)} SOL`} bold />
        </div>
      </div>

      {summary.transactionCount > 1 && (
        <div className="rounded-lg bg-surface/60 border border-white/[0.05] p-3 space-y-2">
          <p className="text-xs font-medium text-surface-muted uppercase tracking-wide">
            Split into {summary.transactionCount} transactions (approved together)
          </p>
          {summary.batches.map((batch) => (
            <div
              key={batch.index}
              className="flex justify-between text-xs text-surface-muted"
            >
              <span>
                Tx {batch.index}: {batch.accountCount} accounts
              </span>
              <span className="font-mono text-brand-400">
                ~{formatSol(batch.youReceiveLamports)} SOL
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-surface-muted">
        {summary.transactionCount > 1
          ? "Phantom may show multiple transactions. Approve all at once to receive the full amount."
          : "Nothing out of pocket. Platform and network fees come from your reclaimed SOL."}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={muted ? "text-surface-muted" : ""}>{label}</span>
      <span className={bold ? "font-semibold text-brand-400" : "font-mono text-sm"}>{value}</span>
    </div>
  );
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 animate-spin ${
        dark
          ? "border-[#06060a]/30 border-t-[#06060a]"
          : "border-white/20 border-t-white"
      }`}
    />
  );
}
