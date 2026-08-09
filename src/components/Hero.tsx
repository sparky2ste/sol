const TRUST_ITEMS = [
  { label: "Non-custodial", desc: "Keys stay in your wallet" },
  { label: "1% fee", desc: "Half of Sol Incinerator" },
  { label: "Zero upfront", desc: "Pay only on success" },
  { label: "Empty accounts only", desc: "No tokens burned or sold" },
];

export function Hero() {
  return (
    <section className="text-center pt-12 pb-8 sm:pt-16 sm:pb-10 animate-fade-in">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-surface-overlay/60 text-xs text-surface-muted mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
        Trusted Solana wallet cleaner
      </div>

      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
        Reclaim SOL locked
        <br />
        <span className="gradient-text">in empty accounts</span>
      </h1>

      <p className="text-surface-muted text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
        Claim free SOL from vacant token accounts, like{" "}
        <a
          href="https://sol-incinerator.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 underline hover:text-white"
        >
          Sol Incinerator
        </a>
        , but at half the fee. Connect your wallet and recover locked rent.{" "}
        <span className="text-white font-medium">1% fee</span> taken from your payout.
      </p>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {TRUST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-overlay/40 border border-white/[0.05] text-left"
          >
            <svg
              className="w-4 h-4 text-brand-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-white">{item.label}</p>
              <p className="text-[11px] text-surface-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
