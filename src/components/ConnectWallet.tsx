"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { SolflareWalletName } from "@solana/wallet-adapter-solflare";
import { truncateAddress } from "@/lib/solana/constants";
import { ui } from "@/lib/ui";
import {
  getMobileWalletContext,
  getPhantomBrowseUrl,
  getPhantomStoreUrl,
  getSolflareBrowseUrl,
  getSolflareStoreUrl,
} from "@/lib/mobileWallet";

type WalletName = typeof PhantomWalletName | typeof SolflareWalletName;

function isWalletReady(state: WalletReadyState | undefined): boolean {
  return (
    state === WalletReadyState.Installed ||
    state === WalletReadyState.Loadable
  );
}

function openExternal(url: string): void {
  window.location.assign(url);
}

export function ConnectWallet({
  className,
  layout = "inline",
}: {
  className?: string;
  layout?: "inline" | "stack";
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

  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingWallet, setPendingWallet] = useState<WalletName | null>(null);
  const connectAttemptRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mobileCtx = mounted ? getMobileWalletContext() : null;
  const isMobile = mobileCtx?.isMobile ?? false;
  const inWalletBrowser = mobileCtx?.inWalletBrowser ?? false;

  const phantom = wallets.find((w) => w.adapter.name === PhantomWalletName);
  const solflare = wallets.find((w) => w.adapter.name === SolflareWalletName);

  const phantomInstalled = mounted && isWalletReady(phantom?.readyState);
  const solflareInstalled = mounted && isWalletReady(solflare?.readyState);

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
    (name: WalletName) => {
      setError(null);

      const entry = wallets.find((w) => w.adapter.name === name);
      if (!entry) {
        setError("Wallet not found. Refresh the page and try again.");
        return;
      }

      if (entry.adapter.readyState === WalletReadyState.NotDetected) {
        setError("Open this page inside your wallet app, then connect.");
        return;
      }

      flushSync(() => {
        select(name);
      });
      setPendingWallet(name);
    },
    [wallets, select]
  );

  const openInPhantom = useCallback(() => {
    setError(null);
    openExternal(getPhantomBrowseUrl());
  }, []);

  const openInSolflare = useCallback(() => {
    setError(null);
    openExternal(getSolflareBrowseUrl());
  }, []);

  const installPhantom = useCallback(() => {
    openExternal(getPhantomStoreUrl());
  }, []);

  const installSolflare = useCallback(() => {
    openExternal(getSolflareStoreUrl());
  }, []);

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
  const isStack = layout === "stack";

  const containerClass = isStack
    ? "flex flex-col items-stretch gap-3 w-full max-w-sm mx-auto"
    : "flex flex-col items-end gap-2";

  const buttonRowClass = isStack
    ? "flex flex-col gap-3 w-full"
    : "flex flex-wrap justify-end gap-2";

  const primaryBtnClass =
    className ??
    (isStack
      ? `${ui.btnPrimary} w-full min-h-[48px] text-base`
      : ui.btnPrimary);

  const secondaryBtnClass = isStack
    ? `${ui.btnSecondary} w-full min-h-[48px] text-base`
    : ui.btnSecondary;

  if (connected && publicKey) {
    return (
      <button
        type="button"
        onClick={handleDisconnect}
        className={
          className ??
          `${ui.btnSecondary} !min-h-[44px]`
        }
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#14F195]" />
        {truncateAddress(publicKey.toBase58(), 4)}
      </button>
    );
  }

  const showMobileHint =
    isMobile && !inWalletBrowser && !phantomInstalled && !solflareInstalled;

  const phantomAction = () => {
    if (phantomInstalled) return connectWallet(PhantomWalletName);
    if (isMobile && !inWalletBrowser) return openInPhantom();
    return installPhantom();
  };

  const solflareAction = () => {
    if (solflareInstalled) return connectWallet(SolflareWalletName);
    if (isMobile && !inWalletBrowser) return openInSolflare();
    return installSolflare();
  };

  const phantomLabel = isConnecting
    ? "Connecting…"
    : phantomInstalled
      ? "Connect Phantom"
      : isMobile && !inWalletBrowser
        ? "Open in Phantom"
        : "Get Phantom";

  const solflareLabel = isConnecting
    ? "Connecting…"
    : solflareInstalled
      ? "Connect Solflare"
      : isMobile && !inWalletBrowser
        ? "Open in Solflare"
        : "Get Solflare";

  const showSolflare =
    isStack || !mounted || solflareInstalled || !phantomInstalled;

  return (
    <div className={containerClass}>
      {showMobileHint && (
        <div
          className={`rounded-xl border border-brand-400/25 bg-brand-400/8 p-4 text-sm text-brand-100/90 ${
            isStack ? "text-center" : "text-right max-w-xs"
          }`}
        >
          <p className="font-medium text-brand-200 mb-1">On mobile?</p>
          <p className="text-brand-100/80 leading-relaxed">
            Tap <strong>Open in Phantom</strong> to load this site in your
            wallet&apos;s browser, then connect and claim.
          </p>
        </div>
      )}

      {inWalletBrowser && !phantomInstalled && !solflareInstalled && (
        <p
          className={`text-xs text-surface-muted ${
            isStack ? "text-center" : "text-right max-w-xs"
          }`}
        >
          Wallet browser detected. Tap connect below.
        </p>
      )}

      <div className={buttonRowClass}>
        <button
          type="button"
          disabled={isConnecting}
          onClick={phantomAction}
          className={primaryBtnClass}
        >
          {phantomLabel}
        </button>

        {showSolflare && (
          <button
            type="button"
            disabled={isConnecting}
            onClick={solflareAction}
            className={secondaryBtnClass}
          >
            {solflareLabel}
          </button>
        )}
      </div>

      {error && (
        <p
          className={`text-xs text-red-400 ${
            isStack ? "text-center" : "max-w-xs text-right"
          }`}
        >
          {error}
        </p>
      )}
    </div>
  );
}
