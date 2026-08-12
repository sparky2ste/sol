"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { BurnModule } from "@/components/BurnModule";
import { SuccessCelebration } from "@/components/SuccessCelebration";
import type { ScanResult } from "@/lib/solana/scanEmptyAccounts";
import { scanWalletViaApi } from "@/lib/solana/scanWalletApi";
import {
  buildReclaimSummary,
  buildReclaimTransactions,
  isWalletUserRejection,
  sendReclaimTransactions,
  WALLET_RENT_RESERVE_LAMPORTS,
} from "@/lib/solana/buildReclaimTransaction";
import {
  formatSol,
  getFeeWallet,
  truncateAddress,
} from "@/lib/solana/constants";
import {
  getRecoverableBreakdown,
  hasRecoverableSol,
  type RecoverableBreakdown,
} from "@/lib/solana/recoverableAccounts";
import { ui } from "@/lib/ui";

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
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    signatures: string[];
    amountLamports: number;
  } | null>(null);
  const [rpcConfigured, setRpcConfigured] = useState<boolean | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [tab, setTab] = useState<"reclaim" | "burn">("reclaim");
  const [needsTurnstile, setNeedsTurnstile] = useState(false);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [burnAcknowledged, setBurnAcknowledged] = useState(false);
  const scanInFlightRef = useRef(false);
  const autoScannedWalletRef = useRef<string | null>(null);
  const isWorkersDev =
    typeof window !== "undefined" &&
    window.location.hostname.endsWith(".workers.dev");

  const feeWallet = useMemo(() => getFeeWallet(), []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => setRpcConfigured(d.rpcConfigured))
      .catch(() => setRpcConfigured(false));
  }, []);

  const recoverable = useMemo(() => {
    if (!scanResult) return null;
    return getRecoverableBreakdown(scanResult, { includeBurnable: true });
  }, [scanResult]);

  const summary = useMemo(() => {
    if (!recoverable?.totalCount || !publicKey) return null;
    return buildReclaimSummary(recoverable.allAccounts, publicKey);
  }, [recoverable, publicKey]);

  const scanWallet = useCallback(
    async (turnstileToken?: string, options?: { keepSuccess?: boolean }) => {
      if (!publicKey || !rpcConfigured || scanInFlightRef.current) return;

      scanInFlightRef.current = true;
      setLoading(true);
      setError(null);
      setNotice(null);
      if (!options?.keepSuccess) {
        setSuccess(null);
      }

      try {
        const result = await scanWalletViaApi(
          publicKey.toBase58(),
          turnstileToken
        );
        setScanResult(result);
        setBurnAcknowledged(false);
        setNeedsTurnstile(false);
        const balance = await connection.getBalance(publicKey, "confirmed");
        setWalletBalance(balance);
      } catch (err) {
        const apiError = err as Error & { code?: string };
        if (apiError.code === "TURNSTILE_FAILED" && !isWorkersDev) {
          setNeedsTurnstile(true);
          setTurnstileResetKey((key) => key + 1);
        }
        setError(apiError.message ?? "Failed to scan wallet");
        setScanResult(null);
      } finally {
        setLoading(false);
        scanInFlightRef.current = false;
      }
    },
    [publicKey, rpcConfigured, connection]
  );

  const handleTurnstileToken = useCallback(
    (token: string) => {
      if (connected && publicKey && rpcConfigured && !scanInFlightRef.current) {
        void scanWallet(token);
      }
    },
    [connected, publicKey, rpcConfigured, scanWallet]
  );

  const requestRescan = useCallback(() => {
    setScanResult(null);
    setWalletBalance(null);
    setError(null);
    setNotice(null);
    if (needsTurnstile) return;
    autoScannedWalletRef.current = null;
    void scanWallet();
  }, [needsTurnstile, scanWallet]);

  useEffect(() => {
    if (!connected || !publicKey) {
      setScanResult(null);
      setSuccess(null);
      setError(null);
      autoScannedWalletRef.current = null;
      return;
    }

    if (scanResult && !scanResult.wallet.equals(publicKey)) {
      setScanResult(null);
      setSuccess(null);
      autoScannedWalletRef.current = null;
    }

    if (!rpcConfigured || needsTurnstile || scanInFlightRef.current) return;

    const walletKey = publicKey.toBase58();
    if (scanResult?.wallet.equals(publicKey)) {
      autoScannedWalletRef.current = walletKey;
      return;
    }

    if (autoScannedWalletRef.current === walletKey) return;

    autoScannedWalletRef.current = walletKey;
    void scanWallet();
  }, [connected, publicKey, rpcConfigured, needsTurnstile, scanResult, scanWallet]);

  const handleClaim = async () => {
    if (!publicKey || !signTransaction || !recoverable?.totalCount) return;

    if (recoverable.burnCount > 0 && !burnAcknowledged) {
      setError("Confirm that junk tokens can be burned to recover this SOL.");
      return;
    }

    if (summary && summary.youReceiveLamports <= 0) {
      setError(
        "Recoverable amount too small after fees. Try closing more accounts."
      );
      return;
    }

    setClaiming(true);
    setClaimProgress(null);
    setError(null);
    setNotice(null);
    setSuccess(null);

    try {
      const { transactions } = await buildReclaimTransactions(
        recoverable.allAccounts,
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

      setSuccess({
        signatures,
        amountLamports: summary?.youReceiveLamports ?? 0,
      });
      void scanWallet(undefined, { keepSuccess: true });
    } catch (err) {
      if (isWalletUserRejection(err)) {
        setNotice("Transaction cancelled in your wallet. No SOL was moved.");
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Transaction failed");
        setNotice(null);
      }
    } finally {
      setClaiming(false);
      setClaimProgress(null);
    }
  };

  if (!connected) {
    return (
      <div className="py-4 sm:py-6">
        <ConnectWallet layout="grid" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rpcConfigured === false && <RpcSetupBanner />}

      <div className="space-y-3">
        <div className="flex gap-6 border-b border-zinc-800/60">
          <TabButton active={tab === "reclaim"} onClick={() => setTab("reclaim")} tone="reclaim">
            Reclaim
          </TabButton>
          <TabButton active={tab === "burn"} onClick={() => setTab("burn")} tone="burn">
            Burn
            {scanResult && scanResult.burnableAccounts.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                {scanResult.burnableAccounts.length}
              </span>
            )}
          </TabButton>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate font-mono text-zinc-400">
            {publicKey ? truncateAddress(publicKey.toBase58(), 6) : "—"}
          </span>
          <button
            type="button"
            onClick={requestRescan}
            disabled={loading || !rpcConfigured}
            className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-[#14F195] disabled:opacity-40"
          >
            {loading ? "Scanning…" : "Rescan"}
          </button>
        </div>
      </div>

      {rpcConfigured === true && needsTurnstile && !isWorkersDev && !loading && (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-3">
          <p className="mb-2 text-center text-xs text-zinc-500">
            One-time security check to scan your wallet.
          </p>
          <TurnstileWidget
            resetKey={turnstileResetKey}
            onToken={handleTurnstileToken}
          />
        </div>
      )}

      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="info" message={notice} />}
      {success && (
        <SuccessCelebration
          kind="reclaim"
          signatures={success.signatures}
          amountLamports={success.amountLamports}
          onDismiss={() => {
            setSuccess(null);
            requestRescan();
          }}
        />
      )}

      {walletBalance !== null &&
        walletBalance < WALLET_RENT_RESERVE_LAMPORTS &&
        scanResult &&
        recoverable &&
        recoverable.totalCount > 0 &&
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
        tab === "burn" ? (
          <BurnModule
            scanResult={scanResult}
            onRescan={requestRescan}
            loading={loading}
            rpcConfigured={!!rpcConfigured}
          />
        ) : (
        <>
          <UnclaimedSolCard
            recoverable={recoverable}
            summary={summary}
            loading={loading}
            empty={
              !hasRecoverableSol(scanResult) &&
              scanResult.protectedAccounts.length === 0 &&
              scanResult.skippedAccounts.length === 0
            }
          />

          {!hasRecoverableSol(scanResult) ? (
            scanResult.protectedAccounts.length === 0 &&
            scanResult.skippedAccounts.length === 0 ? null : (
              <SkippedAccountsCard scanResult={scanResult} />
            )
          ) : (
            <>
              {recoverable && (
                <RecoverableBreakdownCard recoverable={recoverable} />
              )}

              {summary && <BreakdownCard summary={summary} />}

              {recoverable && recoverable.burnCount > 0 && (
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm">
                  <input
                    type="checkbox"
                    checked={burnAcknowledged}
                    onChange={(e) => setBurnAcknowledged(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/40"
                  />
                  <span className="leading-relaxed text-zinc-300">
                    <strong className="text-orange-300">
                      {recoverable.burnCount} junk token account
                      {recoverable.burnCount === 1 ? "" : "s"}
                    </strong>{" "}
                    will be permanently burned to unlock{" "}
                    {formatSol(recoverable.burnRentLamports)} SOL in rent.
                    USDC, USDT, and wSOL are never touched.
                  </span>
                </label>
              )}

              {claiming && claimProgress && summary && summary.transactionCount > 1 && (
                <ClaimProgressBanner
                  progress={claimProgress}
                  totalReceiveLamports={summary.youReceiveLamports}
                />
              )}

              <button
                type="button"
                onClick={handleClaim}
                disabled={
                  claiming ||
                  !rpcConfigured ||
                  ((recoverable?.burnCount ?? 0) > 0 && !burnAcknowledged)
                }
                className={`${ui.btnPrimary} w-full py-3.5 text-base`}
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
                    Recover all SOL
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-zinc-500">
                Closes empty accounts
                {recoverable && recoverable.burnCount > 0
                  ? " and burns junk tokens"
                  : ""}{" "}
                in batched transactions. Use the Burn tab to pick specific tokens.
              </p>
            </>
          )}

          {hasRecoverableSol(scanResult) &&
            (scanResult.protectedAccounts.length > 0 ||
              scanResult.skippedAccounts.length > 0) && (
              <SkippedAccountsCard scanResult={scanResult} compact />
            )}
        </>
        )
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

function Alert({ type, message }: { type: "error" | "info"; message: string }) {
  const styles =
    type === "error"
      ? "border-red-500/25 bg-red-500/8 text-red-300"
      : "border-blue-500/25 bg-blue-500/8 text-blue-200/90";

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${styles}`}>
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-12 text-center">
      <div className="mb-3 inline-flex h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-[#14F195]" />
      <p className="text-sm text-zinc-500">Scanning wallet…</p>
    </div>
  );
}

function UnclaimedSolCard({
  recoverable,
  summary,
  loading,
  empty,
}: {
  recoverable: RecoverableBreakdown | null;
  summary: ReturnType<typeof buildReclaimSummary> | null;
  loading: boolean;
  empty?: boolean;
}) {
  const youReceive = summary?.youReceiveLamports ?? 0;
  const canClaim = (recoverable?.totalCount ?? 0) > 0 && youReceive > 0;

  return (
    <div className="py-2 text-center">
      <p className="mb-1 text-xs uppercase tracking-wider text-zinc-500">
        Total recoverable
      </p>
      <p className="font-display text-4xl font-semibold tabular-nums text-zinc-50 sm:text-5xl">
        {loading ? "—" : formatSol(youReceive)}{" "}
        <span className="text-2xl text-[#14F195] sm:text-3xl">SOL</span>
      </p>

      {empty && !loading && (
        <p className="mt-3 text-sm text-zinc-500">
          Nothing to recover — no empty or junk accounts found.
        </p>
      )}

      {!empty && recoverable && recoverable.totalCount > 0 && (
        <p className="mt-2 text-sm text-zinc-500">
          {recoverable.totalCount} account
          {recoverable.totalCount === 1 ? "" : "s"}
          {recoverable.totalRentLamports > 0 && (
            <> · {formatSol(recoverable.totalRentLamports)} SOL in rent</>
          )}
        </p>
      )}

      {canClaim && (
        <p className="mt-1 text-xs text-zinc-600">
          After 1% fee and network fees
        </p>
      )}

      {!empty &&
        recoverable &&
        recoverable.emptyCount === 0 &&
        recoverable.burnCount > 0 && (
          <p className="mx-auto mt-3 max-w-md text-xs text-orange-300/80">
            {recoverable.burnCount} junk token account
            {recoverable.burnCount === 1 ? "" : "s"} can be burned to unlock
            this SOL.
          </p>
        )}
    </div>
  );
}

function RecoverableBreakdownCard({
  recoverable,
}: {
  recoverable: RecoverableBreakdown;
}) {
  return (
    <div className="flex flex-wrap gap-4 border-t border-zinc-800/60 pt-4 text-sm">
      {recoverable.emptyCount > 0 && (
        <div>
          <p className="text-xs text-zinc-500">Empty accounts</p>
          <p className="font-medium text-[#14F195]">
            {recoverable.emptyCount} · {formatSol(recoverable.emptyRentLamports)} SOL
          </p>
        </div>
      )}
      {recoverable.burnCount > 0 && (
        <div>
          <p className="text-xs text-zinc-500">Junk tokens</p>
          <p className="font-medium text-orange-300">
            {recoverable.burnCount} · {formatSol(recoverable.burnRentLamports)} SOL
          </p>
        </div>
      )}
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
  const protectedList = scanResult.protectedAccounts;
  const blocked = scanResult.skippedAccounts;
  const all = [...protectedList, ...blocked];

  if (all.length === 0) return null;

  return (
    <div className="space-y-2 border-t border-zinc-800/60 pt-4 text-sm">
      <p className="text-xs font-medium text-zinc-400">
        {compact ? "Not included" : "Protected & blocked"}{" "}
        {!compact && `· ${formatSol(scanResult.skippedRentLamports)} SOL`}
      </p>
      {!compact && (
        <p className={`leading-relaxed ${ui.muted}`}>
          USDC, USDT, and wSOL are never burned. Frozen accounts cannot be
          closed.
        </p>
      )}
      <div className="space-y-1.5">
        {all.map((account, i) => (
          <div
            key={i}
            className="flex justify-between gap-3 py-1.5 text-xs text-zinc-500"
          >
            <span>
              {account.label}
              {account.reason === "protected" && (
                <span className="ml-1 text-zinc-600">· protected</span>
              )}
              {account.reason === "frozen" && (
                <span className="ml-1 text-zinc-600">· frozen</span>
              )}
            </span>
            <span className="font-mono">
              {account.uiAmount ?? "?"} · ~{formatSol(account.rentLamports)} SOL
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  tone?: "reclaim" | "burn";
  children: React.ReactNode;
}) {
  const activeColor =
    tone === "burn" ? "border-orange-400 text-orange-300" : "border-[#14F195] text-zinc-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-medium transition-colors ${
        active
          ? activeColor
          : "border-transparent text-zinc-500 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
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
    <div className="rounded-xl border border-surface-border bg-surface-overlay p-4 text-sm space-y-2">
      <p className="font-medium text-brand-400">
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
    <div className={`${ui.card} space-y-4 p-5`}>
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
        <div className="border-t border-surface-border pt-3">
          <Row label="You receive" value={`${formatSol(summary.youReceiveLamports)} SOL`} bold />
        </div>
      </div>

      {summary.transactionCount > 1 && (
        <div className="rounded-lg bg-surface border border-surface-border p-3 space-y-2">
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
