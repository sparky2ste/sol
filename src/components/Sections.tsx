import { Logo } from "@/components/Logo";

const STEPS = [
  {
    num: "01",
    title: "Connect wallet",
    desc: "Link Phantom or Solflare in one click. Non-custodial. Your private keys never leave your browser.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    ),
  },
  {
    num: "02",
    title: "Scan accounts",
    desc: "We detect vacant SPL and Token-2022 accounts with zero balance. Accounts holding tokens are skipped.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    ),
  },
  {
    num: "03",
    title: "Claim SOL",
    desc: "Review the breakdown, sign the transaction, and receive 99% of reclaimed SOL. We take 1% from the payout.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <div className="text-center mb-12">
        <p className="section-label mb-3">How it works</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold">
          Three steps to recover SOL
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="glass-card-hover p-6 relative animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-5">
              <div className="w-11 h-11 rounded-xl bg-accent-400/10 border border-accent-400/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-accent-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {step.icon}
                </svg>
              </div>
              <span className="font-mono text-xs text-accent-400/60">{step.num}</span>
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-surface-muted leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComparisonStrip() {
  return (
    <section className="py-10">
      <div className="glass-card p-6 sm:p-8">
        <div className="grid sm:grid-cols-3 gap-6 text-center sm:divide-x sm:divide-white/[0.06]">
          <div>
            <p className="text-3xl font-display font-bold gradient-text">1%</p>
            <p className="text-sm text-surface-muted mt-1">SOL Reclaim fee</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-surface-muted">~2%</p>
            <p className="text-sm text-surface-muted mt-1">Sol Incinerator fee</p>
          </div>
          <div>
            <p className="text-3xl font-display font-bold text-brand-400">$0</p>
            <p className="text-sm text-surface-muted mt-1">Upfront cost to you</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SecuritySection() {
  const items = [
    "Non-custodial: private keys stay in Phantom or Solflare",
    "We never ask for a seed phrase, private key, or password",
    "Only zero-balance token accounts can be closed",
    "USDC and other funded accounts are skipped automatically",
    "You review the exact transaction before signing",
  ];

  return (
    <section id="security" className="py-16 sm:py-20">
      <div className="text-center mb-10">
        <p className="section-label mb-3">Security</p>
        <h2 className="font-display text-3xl sm:text-4xl font-bold">
          Built to avoid wallet drainer patterns
        </h2>
        <p className="text-surface-muted mt-4 max-w-2xl mx-auto text-sm sm:text-base">
          SOL Reclaim is a rent-recovery utility, not an airdrop or giveaway. No
          upfront payment. No account signup.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-8 max-w-3xl mx-auto">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item} className="flex gap-3 text-sm text-surface-muted">
              <svg
                className="w-5 h-5 text-brand-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <p className="text-xs text-surface-muted text-center sm:text-right max-w-md">
            Non-custodial wallet utility. Not financial advice. You review and
            sign every transaction. SOL Reclaim never asks for your seed phrase.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap justify-center sm:justify-end gap-4 text-xs text-surface-muted">
          <a href="#security" className="hover:text-white transition-colors">
            Security
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </div>
        <div className="mt-8 pt-6 border-t border-white/[0.04] text-center text-xs text-surface-muted/60">
          © {new Date().getFullYear()} SOL Reclaim. Built on Solana.
        </div>
      </div>
    </footer>
  );
}
