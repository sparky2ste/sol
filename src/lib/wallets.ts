import { PhantomWalletName } from "@solana/wallet-adapter-phantom";
import { SolflareWalletName } from "@solana/wallet-adapter-solflare";
import { CoinbaseWalletName } from "@solana/wallet-adapter-coinbase";
import { TrustWalletName } from "@solana/wallet-adapter-trust";

export type SupportedWalletName =
  | typeof PhantomWalletName
  | typeof SolflareWalletName
  | typeof CoinbaseWalletName
  | typeof TrustWalletName;

export interface WalletOption {
  name: SupportedWalletName;
  label: string;
  shortLabel: string;
  accent: string;
  ring: string;
  bg: string;
}

export const WALLET_OPTIONS: WalletOption[] = [
  {
    name: PhantomWalletName,
    label: "Phantom",
    shortLabel: "Phantom",
    accent: "text-violet-300",
    ring: "ring-violet-500/30",
    bg: "from-violet-600/20 to-violet-900/10",
  },
  {
    name: SolflareWalletName,
    label: "Solflare",
    shortLabel: "Solflare",
    accent: "text-amber-300",
    ring: "ring-amber-500/30",
    bg: "from-amber-500/20 to-orange-900/10",
  },
  {
    name: CoinbaseWalletName,
    label: "Coinbase Wallet",
    shortLabel: "Coinbase",
    accent: "text-blue-300",
    ring: "ring-blue-500/30",
    bg: "from-blue-600/20 to-blue-900/10",
  },
  {
    name: TrustWalletName,
    label: "Trust Wallet",
    shortLabel: "Trust",
    accent: "text-sky-300",
    ring: "ring-sky-500/30",
    bg: "from-sky-500/20 to-blue-900/10",
  },
];
