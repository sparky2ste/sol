"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Adapter, WalletError } from "@solana/wallet-adapter-base";
import {
  WalletDisconnectedError,
  WalletNotConnectedError,
} from "@solana/wallet-adapter-base";
import type { ConnectionConfig } from "@solana/web3.js";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import {
  getInitialRpcUrl,
  getRpcUrl,
  PUBLIC_WS_RPC_URL,
} from "@/lib/solana/constants";

function createWallets(): Adapter[] {
  return [new PhantomWalletAdapter(), new SolflareWalletAdapter()];
}

export function SolanaWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [endpoint, setEndpoint] = useState(getInitialRpcUrl);
  const wallets = useMemo(() => createWallets(), []);

  const connectionConfig = useMemo<ConnectionConfig>(
    () => ({
      commitment: "confirmed",
      // /api/rpc is HTTP-only — WebSocket must use a real wss endpoint
      wsEndpoint: PUBLIC_WS_RPC_URL,
    }),
    []
  );

  const onError = useCallback((error: WalletError) => {
    if (
      error instanceof WalletDisconnectedError ||
      error instanceof WalletNotConnectedError ||
      error.name === "WalletNotSelectedError"
    ) {
      return;
    }
    console.error(error);
  }, []);

  useEffect(() => {
    setEndpoint(getRpcUrl());
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect={false} onError={onError}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
