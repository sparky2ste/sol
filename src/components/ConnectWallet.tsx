"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { SolflareWalletName } from "@solana/wallet-adapter-solflare";
import { CoinbaseWalletName } from "@solana/wallet-adapter-coinbase";
import { TrustWalletName } from "@solana/wallet-adapter-trust";
import { truncateAddress } from "@/lib/solana/constants";
import { ui } from "@/lib/ui";
import {
  getMobileWalletContext,
  getPhantomBrowseUrl,
  getPhantomStoreUrl,
  getSolflareBrowseUrl,
  getSolflareStoreUrl,
} from "@/lib/mobileWallet";
import {
  WALLET_OPTIONS,
  type SupportedWalletName,
} from "@/lib/wallets";
import { WalletIcon } from "@/components/WalletIcon";

function isWalletReady(state: WalletReadyState | undefined): boolean {
  return (
    state === WalletReadyState.Installed ||
    state === WalletReadyState.Loadable
  );
}

function openExternal(url: string): void {
  window.location.assign(url);
}

function getWalletStoreUrl(name: SupportedWalletName): string {
  if (name === PhantomWalletName) return getPhantomStoreUrl();
  if (name === SolflareWalletName) return getSolflareStoreUrl();
  if (name === CoinbaseWalletName)
    return "https://www.coinbase.com/wallet/downloads";
  if (name === TrustWalletName) return "https://trustwallet.com/download";
  return "https://phantom.app/download";
}

export function ConnectWallet({
  className,
  layout = "inline",
  showSecondary = true,
}: {
  className?: string;
  layout?: "inline" | "stack" | "grid";
  showSecondary?: boolean;
}) {
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    select,
    connect,
    wallet,
    wallets,
  } = useWallet();
  const { setVisible } = useWalletModal();

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingWallet, setPendingWallet] = useState<SupportedWalletName | null>(
    null
  );
  const connectAttemptRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileCtx = mounted ? getMobileWalletContext() : null;
  const isMobile = mobileCtx?.isMobile ?? false;
  const inWalletBrowser = mobileCtx?.inWalletBrowser ?? false;

  const walletEntries = WALLET_OPTIONS.map((option) => ({
    ...option,
    entry: wallets.find((w) => w.adapter.name === option.name),
    installed:
      mounted &&
      isWalletReady(
        wallets.find((w) => w.adapter.name === option.name)?.readyState
      ),
  }));

  const anyInstalled = walletEntries.some((w) => w.installed);

  useEffect(() => {
    if (!pendingWallet) return;
    if (!wallet || wallet.adapter.name !== pendingWallet) return;
    if (connected) {
      setPendingWallet(null);
      setBusy(false);
      return;
    }
    if (connecting) return;

    const attemptId = ++connectAttemptRef.current;
    setBusy(true);

    connect()
      .catch((err: unknown) => {
        if (connectAttemptRef.current !== attemptId) return;
        const message =
          err instanceof Error ? err.message : "Failed to connect wallet";
        if (!message.toLowerCase().includes("rejected")) {
          setError(message);
        }
      })
      .finally(() => {
        if (connectAttemptRef.current !== attemptId) return;
        setBusy(false);
        setPendingWallet(null);
      });
  }, [pendingWallet, wallet, connected, connecting, connect]);

  const connectWallet = useCallback(
    (name: SupportedWalletName) => {
      setError(null);

      const entry = wallets.find((w) => w.adapter.name === name);
      if (!entry) {
        setError("Wallet not found. Refresh the page and try again.");
        return;
      }

      if (entry.adapter.readyState === WalletReadyState.NotDetected) {
        if (name === PhantomWalletName && isMobile && !inWalletBrowser) {
          openExternal(getPhantomBrowseUrl());
          return;
        }
        if (name === SolflareWalletName && isMobile && !inWalletBrowser) {
          openExternal(getSolflareBrowseUrl());
          return;
        }
        openExternal(getWalletStoreUrl(name));
        return;
      }

      flushSync(() => {
        select(name);
      });
      setPendingWallet(name);
    },
    [wallets, select, isMobile, inWalletBrowser]
  );

  const handleDisconnect = useCallback(async () => {
    setError(null);
    setPendingWallet(null);
    connectAttemptRef.current++;
    try {
      await disconnect();
    } catch {
      // Already disconnected
    }
  }, [disconnect]);

  const isConnecting = connecting || busy || pendingWallet !== null;
  const isGrid = layout === "stack" || layout === "grid";

  if (connected && publicKey) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        className={
          className ?? `${ui.btnSecondary} !min-h-[44px] gap-2`
        }
      >
        {wallet && (
          <WalletIcon
            wallet={wallet.adapter.name as SupportedWalletName}
            className="h-5 w-5 rounded-md"
          />
        )}
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#14F195]" />
        {truncateAddress(publicKey.toBase58(), 4)}
      </button>
    );
  }

  if (!isGrid) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => setVisible(true)}
          className={className ?? ui.btnPrimary}
        >
          Connect wallet
        </button>
        {error && (
          <p className="max-w-xs text-right text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }

  const visibleWallets = showSecondary
    ? walletEntries
    : walletEntries.slice(0, 1);

  const showMobileHint =
    isMobile && !inWalletBrowser && !anyInstalled;

  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      {showMobileHint && (
        <div className="mb-3 rounded-lg border border-[#14F195]/15 bg-[#14F195]/5 px-3 py-2.5 text-center text-xs text-zinc-400">
          Tap a wallet to open in its app browser, then connect.
        </div>
      )}

      <div className="space-y-2">
        {visibleWallets.map((item) => {
          const actionLabel = item.installed
            ? "Connect"
            : isMobile && !inWalletBrowser
              ? "Open"
              : "Install";

          return (
            <button
              key={item.name}
              type="button"
              disabled={isConnecting}
              onClick={() => connectWallet(item.name)}
              className="group flex w-full items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/50 px-4 py-3 text-left transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/60 disabled:opacity-50"
            >
              <WalletIcon
                wallet={item.name}
                className="h-8 w-8 shrink-0 rounded-lg"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
                {item.shortLabel}
              </span>
              <span
                className={`text-xs ${
                  item.installed ? "text-[#14F195]" : "text-zinc-500"
                }`}
              >
                {isConnecting ? "…" : actionLabel}
              </span>
              <svg
                className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setVisible(true)}
        className="w-full py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        More wallets
      </button>

      {error && (
        <p className="pt-1 text-center text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
