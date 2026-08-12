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
    <div className="mx-auto w-full max-w-md space-y-4">
      {showMobileHint && (
        <div className="rounded-xl border border-[#14F195]/20 bg-[#14F195]/5 p-4 text-center text-sm text-emerald-100/90">
          <p className="mb-1 font-medium text-[#14F195]">On mobile?</p>
          <p className="leading-relaxed text-zinc-400">
            Tap a wallet below to open this site in its in-app browser, then
            connect and claim.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {visibleWallets.map((item) => {
          const actionLabel = item.installed
            ? "Connect"
            : isMobile && !inWalletBrowser
              ? "Open app"
              : "Install";

          return (
            <button
              key={item.name}
              type="button"
              disabled={isConnecting}
              onClick={() => connectWallet(item.name)}
              className={`group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/90 hover:shadow-lg hover:shadow-black/20 disabled:opacity-50 ${item.ring} hover:ring-1`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${item.bg}`}
              />
              <div className="relative flex items-center gap-3">
                <WalletIcon
                  wallet={item.name}
                  className="h-10 w-10 shrink-0 rounded-xl shadow-md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-50">
                    {item.shortLabel}
                  </p>
                  <p className={`text-xs ${item.installed ? "text-[#14F195]" : ui.muted}`}>
                    {isConnecting ? "Connecting…" : actionLabel}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setVisible(true)}
        className={`${ui.btnSecondary} w-full !min-h-[44px] text-sm`}
      >
        More wallets
      </button>

      {error && (
        <p className="text-center text-xs text-red-400">{error}</p>
      )}

      <p className={`text-center text-xs leading-relaxed ${ui.muted}`}>
        Non-custodial. We never ask for your seed phrase.
      </p>
    </div>
  );
}
