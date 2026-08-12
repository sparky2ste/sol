"use client";

import { Mascot } from "@/components/Mascot";
import { WalletIcon } from "@/components/WalletIcon";
import { WALLET_OPTIONS } from "@/lib/wallets";
import { ui } from "@/lib/ui";

const FEATURES = [
  "Non-custodial",
  "1% fee only",
  "Burn junk tokens",
  "Instant scan",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-1 pt-10 pb-12 sm:pt-14 sm:pb-16">
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-[#14F195]/10 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl animate-pulse-glow [animation-delay:1s]" />

      <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div className="text-center lg:text-left">
          <div className="animate-fade-in-up mb-5 inline-flex items-center gap-2 rounded-full border border-[#14F195]/20 bg-[#14F195]/5 px-3 py-1.5 text-xs font-medium text-[#14F195]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F195] opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F195]" />
            </span>
            Solana wallet cleaner · live on mainnet
          </div>

          <h1
            className={`${ui.heading} animate-fade-in-up mx-auto mb-5 max-w-xl text-4xl leading-[1.08] sm:text-5xl lg:mx-0 lg:text-[3.25rem] [animation-delay:80ms]`}
          >
            Reclaim{" "}
            <span className="text-gradient-brand">locked SOL</span>
            <br className="hidden sm:block" />
            {" "}from dead accounts
          </h1>

          <p
            className={`animate-fade-in-up mx-auto mb-7 max-w-lg text-base leading-relaxed text-zinc-400 lg:mx-0 [animation-delay:160ms]`}
          >
            Scan your wallet for empty token accounts and worthless junk.
            Close them in one click — recover rent, burn trash, climb the
            leaderboard.
          </p>

          <div className="animate-fade-in-up mb-8 flex flex-wrap justify-center gap-2 lg:justify-start [animation-delay:240ms]">
            {FEATURES.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400 transition-colors duration-200 hover:border-[#14F195]/30 hover:text-zinc-200"
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="animate-fade-in-up mb-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start [animation-delay:320ms]">
            <a
              href="#tool"
              className={`${ui.btnPrimary} glow-brand group relative min-w-[180px] overflow-hidden`}
            >
              <span className="relative z-10">Start reclaiming</span>
              <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </a>
            <a href="/leaderboard" className={ui.btnSecondary}>
              View leaderboard
            </a>
          </div>

          <div className="animate-fade-in-up mb-8 [animation-delay:400ms]">
            <p className="mb-2.5 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              Works with
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {WALLET_OPTIONS.map((wallet) => (
                <div
                  key={wallet.name}
                  className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-600 hover:bg-zinc-900/70"
                  title={wallet.label}
                >
                  <WalletIcon wallet={wallet.name} className="h-5 w-5 rounded-md" />
                  <span className="text-xs text-zinc-400">{wallet.shortLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="animate-float relative">
            <div className="absolute inset-0 scale-90 rounded-full bg-[#14F195]/15 blur-3xl animate-pulse-glow" />
            <div className="ring-conic relative rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm">
              <Mascot size="hero" priority />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <a
          href="#tool"
          className="flex flex-col items-center gap-1 text-zinc-600 transition-colors hover:text-zinc-400"
          aria-label="Scroll to tool"
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <svg
            className="h-4 w-4 animate-bounce"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  );
}
