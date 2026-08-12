import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const STEPS = [
  {
    num: "1",
    title: "Connect wallet",
    desc: "Link Phantom or Solflare. Your keys never leave your browser.",
  },
  {
    num: "2",
    title: "Scan accounts",
    desc: "We find empty SPL and Token-2022 accounts. Funded accounts are skipped.",
  },
  {
    num: "3",
    title: "Claim SOL",
    desc: "Review the breakdown, sign once, and receive your reclaimed SOL.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-zinc-800 py-16 sm:py-20">
      <div className="mb-10">
        <p className={`${ui.label} mb-2`}>How it works</p>
        <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>Three steps</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.num} className={`${ui.card} p-5`}>
            <span className="mb-3 block font-mono text-xs text-[#14F195]">
              {step.num}
            </span>
            <h3 className="mb-1.5 font-medium">{step.title}</h3>
            <p className={`text-sm leading-relaxed ${ui.muted}`}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComparisonStrip() {
  return (
    <section className="border-t border-zinc-800 py-12">
      <div className="grid grid-cols-2 gap-4">
        <div className={`${ui.card} p-6 text-center`}>
          <p className={`${ui.heading} text-3xl text-[#14F195]`}>1%</p>
          <p className={`mt-1 text-sm ${ui.muted}`}>Platform fee</p>
        </div>
        <div className={`${ui.card} p-6 text-center`}>
          <p className={`${ui.heading} text-3xl`}>$0</p>
          <p className={`mt-1 text-sm ${ui.muted}`}>Upfront cost</p>
        </div>
      </div>
    </section>
  );
}

export function SecuritySection() {
  const items = [
    "Non-custodial: private keys stay in your wallet",
    "We never ask for a seed phrase or private key",
    "Only zero-balance token accounts can be closed",
    "Funded accounts are skipped automatically",
    "You review every transaction before signing",
  ];

  return (
    <section id="security" className="border-t border-zinc-800 py-16 sm:py-20">
      <div className="mb-8">
        <p className={`${ui.label} mb-2`}>Security</p>
        <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>
          Non-custodial by design
        </h2>
      </div>

      <div className={`${ui.card} p-6 sm:p-8`}>
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item} className={`flex gap-3 text-sm ${ui.muted}`}>
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-[#14F195]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-4 border-t border-zinc-800">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className={`text-center text-xs sm:text-right ${ui.muted}`}>
            Non-custodial. Not financial advice. {BRAND.fullName} never asks for
            your seed phrase.
          </p>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} {BRAND.fullName}
        </p>
      </div>
    </footer>
  );
}
