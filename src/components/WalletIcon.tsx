"use client";

import type { SupportedWalletName } from "@/lib/wallets";

export function WalletIcon({
  wallet,
  className = "h-6 w-6",
}: {
  wallet: SupportedWalletName;
  className?: string;
}) {
  const name = wallet as string;

  if (name === "Phantom") {
    return (
      <svg className={className} viewBox="0 0 128 128" aria-hidden="true">
        <defs>
          <linearGradient id="phantom-g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#534BB1" />
            <stop offset="100%" stopColor="#551BF9" />
          </linearGradient>
        </defs>
        <rect width="128" height="128" rx="28" fill="url(#phantom-g)" />
        <path
          fill="#fff"
          d="M88.2 64.5c0 12.4-10 22.4-22.4 22.4-6.2 0-11.8-2.5-15.9-6.6l-8.3 8.3c6.4 6.4 15.2 10.3 24.2 10.3 19.6 0 35.5-15.9 35.5-35.5S85.8 27.9 66.2 27.9c-9 0-17.8 3.9-24.2 10.3l8.3 8.3c4.1-4.1 9.7-6.6 15.9-6.6 12.4 0 22.4 10 22.4 22.6z"
        />
      </svg>
    );
  }

  if (name === "Solflare") {
    return (
      <svg className={className} viewBox="0 0 128 128" aria-hidden="true">
        <rect width="128" height="128" rx="28" fill="#FC7227" />
        <path
          fill="#fff"
          d="M64 28L92 56H72v44H56V56H36L64 28z"
        />
      </svg>
    );
  }

  if (name === "Coinbase Wallet") {
    return (
      <svg className={className} viewBox="0 0 128 128" aria-hidden="true">
        <rect width="128" height="128" rx="28" fill="#0052FF" />
        <circle cx="64" cy="64" r="28" fill="#fff" />
        <rect x="52" y="52" width="24" height="24" rx="4" fill="#0052FF" />
      </svg>
    );
  }

  if (name === "Trust") {
    return (
      <svg className={className} viewBox="0 0 128 128" aria-hidden="true">
        <rect width="128" height="128" rx="28" fill="#0500FF" />
        <path
          fill="#fff"
          d="M64 34c-12 8-24 8-32 8 2 24 14 44 32 52 18-8 30-28 32-52-8 0-20 0-32-8z"
        />
      </svg>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400 ${className}`}
    >
      ?
    </span>
  );
}
