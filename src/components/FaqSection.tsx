"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Do you ever ask for my seed phrase or private key?",
    a: "Never. SOL Reclaim only connects through Phantom or Solflare. You approve each transaction in your wallet. If any site asks for a seed phrase while claiming to be us, it is a scam.",
  },
  {
    q: "Is SOL Reclaim safe to use?",
    a: "Yes. We only close empty SPL token accounts with zero balance. Your USDC, active tokens, and NFTs are never touched, burned, or sold. Every transaction requires your explicit wallet signature. We are fully non-custodial.",
  },
  {
    q: "What fees do you charge?",
    a: "A 1% fee on successfully reclaimed SOL, deducted from your payout with no upfront cost. Sol Incinerator charges roughly 2% for the same empty-account cleanup.",
  },
  {
    q: "How much SOL can I recover?",
    a: "Each empty token account holds roughly 0.002 SOL in rent deposits. Active traders often accumulate dozens of vacant accounts, which can add up quickly.",
  },
  {
    q: "Why was my USDC account skipped?",
    a: "Accounts that still hold tokens are not empty, so we skip them. Send the USDC out in Phantom first, then rescan. Once the balance is zero, you can claim the rent back safely.",
  },
  {
    q: "Which wallets are supported?",
    a: "Phantom and Solflare on desktop and mobile. On your phone, tap Open in Phantom to load the site in Phantom's in-app browser, then connect and claim. Fully non-custodial.",
  },
  {
    q: "How do I use this on my phone?",
    a: "Open this site in Safari or Chrome, tap Open in Phantom, and the page reloads inside Phantom's built-in browser. Connect your wallet there and tap Claim SOL. Signing works the same as on desktop.",
  },
  {
    q: "Do I need an API key to use this site?",
    a: "No. Connect your wallet and scan — nothing to install or configure. The site operator runs the infrastructure; you only sign transactions in your wallet.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 sm:py-20">
      <div className="text-center mb-10">
        <p className="section-label mb-3">FAQ</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold">
          Common questions
        </h2>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {FAQS.map((faq, i) => (
          <div
            key={faq.q}
            className="glass-card overflow-hidden transition-colors hover:border-white/10"
          >
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
            >
              <span className="font-medium text-[15px]">{faq.q}</span>
              <svg
                className={`w-5 h-5 text-surface-muted shrink-0 transition-transform duration-200 ${
                  open === i ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {open === i && (
              <div className="px-5 pb-5 -mt-1">
                <p className="text-sm text-surface-muted leading-relaxed">{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
