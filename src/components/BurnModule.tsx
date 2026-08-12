"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { ScanResult } from "@/lib/solana/scanEmptyAccounts";
import {
  burnableToEmptyAccount,
  type BurnableTokenAccount,
} from "@/lib/solana/scanEmptyAccounts";
import {
  buildReclaimSummary,
  buildReclaimTransactions,
  isWalletUserRejection,
  sendReclaimTransactions,
} from "@/lib/solana/buildReclaimTransaction";
import {
  formatSol,
  getFeeWallet,
  truncateAddress,
} from "@/lib/solana/constants";
import { ui } from "@/lib/ui";

interface BurnModuleProps {
  scanResult: ScanResult;
  onRescan: () => void;
  loading: boolean;
  rpcConfigured: boolean;
}

export function BurnModule({
  scanResult,
  onRescan,
  loading,
  rpcConfigured,
}: BurnModuleProps) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const feeWallet = useMemo(() => getFeeWallet(), []);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [burning, setBurning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);

  const burnable = scanResult.burnableAccounts;
  const walletKey = scanResult.wallet.toBase58();

  useEffect(() => {
    setSelected(new Set());
    setShowConfirm(false);
    setAcknowledged(false);
    setError(null);
    setNotice(null);
    setSuccess(null);
  }, [walletKey, burnable.length]);

  const selectedAccounts = useMemo(
    () => burnable.filter((a) => selected.has(a.pubkey.toBase58())),
    [burnable, selected]
  );

  const summary = useMemo(() => {
    if (!publicKey || selectedAccounts.length === 0) return null;
    const emptyAccounts = selectedAccounts.map(burnableToEmptyAccount);
    return buildReclaimSummary(emptyAccounts, publicKey);
  }, [selectedAccounts, publicKey]);

  const toggle = (pubkey: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pubkey)) next.delete(pubkey);
      else next.add(pubkey);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(burnable.map((a) => a.pubkey.toBase58())));
  };

  const clearAll = () => setSelected(new Set());

  const handleBurn = useCallback(async () => {
    if (!publicKey || !signTransaction || selectedAccounts.length === 0) return;

    setBurning(true);
    setProgress(null);
    setError(null);
    setNotice(null);
    setSuccess(null);
    setShowConfirm(false);

    try {
      const accounts = selectedAccounts.map(burnableToEmptyAccount);
      const { transactions } = await buildReclaimTransactions(
        accounts,
        publicKey,
        feeWallet,
        connection
      );

      const signatures = await sendReclaimTransactions(
        connection,
        transactions,
        signTransaction,
        (current, total) => setProgress({ current, total }),
        signAllTransactions ?? undefined
      );

      setSuccess(signatures);
      setSelected(new Set());
      onRescan();
    } catch (err) {
      if (isWalletUserRejection(err)) {
        setNotice("Burn cancelled in your wallet. No tokens were burned.");
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : "Burn failed");
        setNotice(null);
      }
    } finally {
      setBurning(false);
      setProgress(null);
      setAcknowledged(false);
    }
  }, [
    publicKey,
    signTransaction,
    signAllTransactions,
    selectedAccounts,
    feeWallet,
    connection,
    onRescan,
  ]);

  if (burnable.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center">
        <p className="font-medium">No burnable tokens found</p>
        <p className={`mt-1 text-sm ${ui.muted}`}>
          Accounts with USDC, USDT, or wSOL are never shown here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={`text-sm ${ui.muted}`}>
            {burnable.length} token account{burnable.length === 1 ? "" : "s"} ·{" "}
            ~{formatSol(scanResult.burnableRentLamports)} SOL rent recoverable
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className={ui.btnSecondary}>
            Select all
          </button>
          <button
            type="button"
            onClick={clearAll}
            className={ui.btnSecondary}
            disabled={selected.size === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <div className={`${ui.card} divide-y divide-zinc-800 overflow-hidden`}>
        {burnable.map((account) => (
          <BurnRow
            key={account.pubkey.toBase58()}
            account={account}
            checked={selected.has(account.pubkey.toBase58())}
            onToggle={() => toggle(account.pubkey.toBase58())}
          />
        ))}
      </div>

      {scanResult.protectedAccounts.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm">
          <p className="font-medium text-zinc-300">Protected (not burnable)</p>
          <p className={`mt-1 text-xs ${ui.muted}`}>
            {scanResult.protectedAccounts.map((a) => a.label).join(", ")} and
            other known tokens are excluded from burn.
          </p>
        </div>
      )}

      {error && <Alert type="error" message={error} />}
      {notice && <Alert type="info" message={notice} />}
      {success && <SuccessAlert signatures={success} />}

      {summary && selected.size > 0 && (
        <div className={`${ui.card} space-y-2 p-4 text-sm`}>
          <div className="flex justify-between">
            <span className={ui.muted}>Selected</span>
            <span>{selected.size} accounts</span>
          </div>
          <div className="flex justify-between">
            <span className={ui.muted}>Rent recovered (est.)</span>
            <span className="font-mono text-[#14F195]">
              ~{formatSol(summary.youReceiveLamports)} SOL
            </span>
          </div>
        </div>
      )}

      {burning && progress && summary && summary.transactionCount > 1 && (
        <p className={`text-center text-sm ${ui.muted}`}>
          Sending {progress.current} of {progress.total}…
        </p>
      )}

      <button
        type="button"
        disabled={
          burning ||
          selected.size === 0 ||
          !rpcConfigured ||
          !summary ||
          summary.youReceiveLamports <= 0
        }
        onClick={() => {
          setAcknowledged(false);
          setShowConfirm(true);
        }}
        className={`${ui.btnPrimary} w-full border border-red-500/30 bg-red-500/90 py-3.5 text-base hover:bg-red-500`}
      >
        {burning ? "Burning…" : `Review burn (${selected.size})`}
      </button>

      {showConfirm && summary && (
        <ConfirmBurnModal
          accounts={selectedAccounts}
          summary={summary}
          acknowledged={acknowledged}
          onAcknowledge={setAcknowledged}
          onClose={() => {
            setShowConfirm(false);
            setAcknowledged(false);
          }}
          onConfirm={handleBurn}
          burning={burning}
        />
      )}
    </div>
  );
}

function BurnRow({
  account,
  checked,
  onToggle,
}: {
  account: BurnableTokenAccount;
  checked: boolean;
  onToggle: () => void;
}) {
  const balance =
    account.uiAmount != null
      ? String(account.uiAmount)
      : account.tokenAmount;

  return (
    <label className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-800/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-[#14F195] focus:ring-[#14F195]/40"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{account.label}</p>
        <p className={`truncate font-mono text-xs ${ui.muted}`}>
          {truncateAddress(account.mint.toBase58(), 6)}
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="font-mono">{balance}</p>
        <p className={`text-xs ${ui.muted}`}>
          +{formatSol(account.rentLamports)} SOL
        </p>
      </div>
    </label>
  );
}

function ConfirmBurnModal({
  accounts,
  summary,
  acknowledged,
  onAcknowledge,
  onClose,
  onConfirm,
  burning,
}: {
  accounts: BurnableTokenAccount[];
  summary: ReturnType<typeof buildReclaimSummary>;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
  burning: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-4 sm:items-center">
      <div
        className={`${ui.card} max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-2xl`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="burn-confirm-title"
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15">
            <svg
              className="h-5 w-5 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 id="burn-confirm-title" className="text-lg font-semibold">
              Confirm token burn
            </h3>
            <p className={`mt-1 text-sm ${ui.muted}`}>
              This permanently destroys the tokens you selected. It cannot be
              undone.
            </p>
          </div>
        </div>

        <ul className="mb-4 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-sm">
          {accounts.map((a) => (
            <li
              key={a.pubkey.toBase58()}
              className="flex justify-between gap-2"
            >
              <span className="truncate">{a.label}</span>
              <span className={`shrink-0 font-mono text-xs ${ui.muted}`}>
                {a.uiAmount ?? a.tokenAmount}
              </span>
            </li>
          ))}
        </ul>

        <div className="mb-4 space-y-1.5 rounded-xl border border-zinc-800 p-3 text-sm">
          <div className="flex justify-between">
            <span className={ui.muted}>Accounts</span>
            <span>{summary.accountCount}</span>
          </div>
          <div className="flex justify-between">
            <span className={ui.muted}>You receive (est.)</span>
            <span className="font-mono text-[#14F195]">
              ~{formatSol(summary.youReceiveLamports)} SOL
            </span>
          </div>
        </div>

        <label className="mb-6 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAcknowledge(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-red-500 focus:ring-red-500/40"
          />
          <span>
            I understand these tokens will be{" "}
            <strong className="text-red-400">permanently destroyed</strong> and
            I have verified none of them are tokens I want to keep.
          </span>
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={burning}
            className={`${ui.btnSecondary} flex-1`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || burning}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {burning ? "Confirm in wallet…" : "Burn & reclaim SOL"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Alert({ type, message }: { type: "error" | "info"; message: string }) {
  const styles =
    type === "error"
      ? "border-red-500/30 bg-red-500/10 text-red-300"
      : "border-blue-500/30 bg-blue-500/10 text-blue-200";

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles}`}>{message}</div>
  );
}

function SuccessAlert({ signatures }: { signatures: string[] }) {
  return (
    <div className="rounded-xl border border-[#14F195]/30 bg-[#14F195]/10 p-4 text-sm">
      <p className="font-semibold text-[#14F195]">Burn complete</p>
      {signatures.map((sig) => (
        <a
          key={sig}
          href={`https://solscan.io/tx/${sig}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-1 block font-mono text-xs hover:text-[#14F195] ${ui.muted}`}
        >
          {truncateAddress(sig, 8)} on Solscan
        </a>
      ))}
    </div>
  );
}
