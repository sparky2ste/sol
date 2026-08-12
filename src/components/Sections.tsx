import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const STEPS = [
  {
    num: "1",
    title: "Connect wallet",
    desc: "Phantom or Solflare. Keys never leave your browser.",
  },
  {
    num: "2",
    title: "Scan accounts",
    desc: "We find empty SPL and Token-2022 accounts only.",
  },
  {
    num: "3",
    title: "Claim SOL",
    desc: "Review the breakdown, sign once, receive your SOL.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={ui.section}>
      <div className="mb-8">
        <h2 className={`${ui.heading} text-2xl`}>How it works</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.num} className={`${ui.card} h-full p-5`}>
            <span className="mb-3 block font-mono text-xs text-zinc-500">
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
    <section className="pb-10">
      <div className={`${ui.card} flex items-center justify-between gap-6 px-6 py-5`}>
        <div>
          <p className={`${ui.heading} text-2xl ${ui.accent}`}>1%</p>
          <p className={`text-xs ${ui.muted}`}>fee on reclaimed SOL</p>
        </div>
        <div className="h-10 w-px bg-zinc-800" />
        <div className="text-right">
          <p className={`${ui.heading} text-2xl`}>$0</p>
          <p className={`text-xs ${ui.muted}`}>upfront</p>
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
    <section id="security" className={ui.section}>
      <div className="mb-6">
        <h2 className={`${ui.heading} text-2xl`}>Security</h2>
      </div>

      <div className={`${ui.card} p-6 sm:p-8`}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className={`flex gap-3 text-sm ${ui.muted}`}>
              <span className={ui.accent}>✓</span>
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
    <footer className="border-t border-zinc-800/80">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className={`text-center text-xs sm:text-right ${ui.muted}`}>
            Non-custodial. Not financial advice. {BRAND.fullName} never asks
            for your seed phrase.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} {BRAND.fullName}
        </p>
      </div>
    </footer>
  );
}
