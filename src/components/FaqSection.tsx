"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/AnimateIn";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const FAQS = [
  {
    q: "Do you ever ask for my seed phrase or private key?",
    a: `Never. ${BRAND.fullName} only connects through Phantom or Solflare. You approve each transaction in your wallet.`,
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
    a: "Phantom and Solflare on desktop and mobile.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className={ui.section}>
      <AnimateIn>
        <div className="mb-8 max-w-lg">
          <p className={ui.sectionEyebrow}>FAQ</p>
          <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>
            Common questions
          </h2>
        </div>
      </AnimateIn>

      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <AnimateIn key={faq.q} delay={i * 60}>
            <div className={`${ui.card} overflow-hidden`}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm"
            >
              <span className="font-medium">{faq.q}</span>
              <svg
                className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                  open === i ? "rotate-180" : ""
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
            {open === i && (
              <div className="-mt-1 px-4 pb-4">
                <p className={`text-sm leading-relaxed ${ui.muted}`}>{faq.a}</p>
              </div>
            )}
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}
