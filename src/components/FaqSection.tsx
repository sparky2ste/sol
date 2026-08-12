"use client";

import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const FAQS = [
  {
    q: "Do you ever ask for my seed phrase or private key?",
    a: `Never. ${BRAND.fullName} only connects through your wallet app — Phantom, Solflare, Coinbase Wallet, or Trust. You approve each transaction in your wallet.`,
  },
  {
    q: `Is ${BRAND.fullName} safe to use?`,
    a: "Yes. We only close empty SPL token accounts with zero balance. Your tokens and NFTs are never touched.",
  },
  {
    q: "What fees do you charge?",
    a: "A 1% fee on successfully reclaimed SOL, deducted from your payout. No upfront cost.",
  },
  {
    q: "How much SOL can I recover?",
    a: "Each empty token account holds roughly 0.002 SOL in rent. Active traders often accumulate dozens of vacant accounts.",
  },
  {
    q: "Why was my USDC account skipped?",
    a: "Accounts that still hold tokens are not empty. Send the balance out first, then rescan.",
  },
  {
    q: "Which wallets are supported?",
    a: "Phantom, Solflare, Coinbase Wallet, and Trust — on desktop and mobile.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={ui.section}>
      <div className="mb-6">
        <h2 className={`${ui.heading} text-2xl`}>FAQ</h2>
      </div>

      <div className="space-y-2">
        {FAQS.map((faq, i) => {
          const isOpen = open === i;
          return (
            <div
              key={faq.q}
              className={`${ui.card} overflow-hidden transition-colors duration-300 ${
                isOpen ? "border-[#14F195]/20 bg-zinc-900/70" : "hover:border-zinc-700"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm"
                aria-expanded={isOpen}
              >
                <span
                  className={`font-medium transition-colors duration-200 ${
                    isOpen ? "text-zinc-50" : "text-zinc-300"
                  }`}
                >
                  {faq.q}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 transition-all duration-300 ${
                    isOpen ? "rotate-180 text-[#14F195]" : "text-zinc-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div className={`expandable ${isOpen ? "open" : ""}`}>
                <div>
                  <p className={`px-4 pb-4 text-sm leading-relaxed ${ui.muted}`}>
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
