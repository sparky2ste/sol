"use client";

import type { ReactNode } from "react";
import { SolanaWalletProvider } from "@/components/WalletProvider";

export function ClientProviders({ children }: { children: ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
