import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const STEPS = [
  {
    num: "01",
    title: "Connect wallet",
    desc: "Phantom, Solflare, Coinbase Wallet, or Trust. Keys never leave your device.",
    icon: "🔗",
  },
  {
    num: "02",
    title: "Scan accounts",
    desc: "We detect empty SPL accounts and junk tokens you can burn safely.",
    icon: "🔍",
  },
  {
    num: "03",
    title: "Recover SOL",
    desc: "Review the breakdown, sign once, and receive your SOL instantly.",
    icon: "⚡",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={ui.section}>
      <div className="mb-10">
        <p className={`${ui.sectionEyebrow} uppercase tracking-widest`}>
          Simple flow
        </p>
        <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>How it works</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="glass-card group h-full p-6 transition-transform hover:-translate-y-1"
            style={{ transitionDelay: `${i * 50}ms` }}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">
                {step.icon}
              </span>
              <span className="font-mono text-xs text-zinc-600">{step.num}</span>
            </div>
            <h3 className="mb-2 font-display text-lg font-semibold">{step.title}</h3>
            <p className={`text-sm leading-relaxed ${ui.muted}`}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ComparisonStrip() {
  return (
    <section className="pb-12">
      <div className="glass-card grid grid-cols-2 gap-6 px-6 py-6 sm:grid-cols-4 sm:px-8">
        <StatBlock value="1%" label="fee on recovered SOL" accent />
        <StatBlock value="$0" label="upfront cost" />
        <StatBlock value="4" label="wallets supported" />
        <StatBlock value="100%" label="non-custodial" />
      </div>
    </section>
  );
}

function StatBlock({
  value,
  label,
  accent,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center sm:text-left">
      <p
        className={`font-display text-2xl font-bold sm:text-3xl ${
          accent ? ui.accent : "text-zinc-50"
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 text-xs ${ui.muted}`}>{label}</p>
    </div>
  );
}

export function SecuritySection() {
  const items = [
    "Non-custodial: private keys stay in your wallet",
    "We never ask for a seed phrase or private key",
    "Only zero-balance token accounts can be closed",
    "Funded accounts are skipped automatically",
    "You review every transaction before signing",
    "Open source friendly — verify before you sign",
  ];

  return (
    <section id="security" className={ui.section}>
      <div className="mb-8">
        <p className={`${ui.sectionEyebrow} uppercase tracking-widest`}>
          Trust
        </p>
        <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>Security</h2>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className={`flex gap-3 text-sm ${ui.muted}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#14F195]/10 text-xs text-[#14F195]">
                ✓
              </span>
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
    <footer className="border-t border-zinc-800/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Logo size="sm" />
          <p className={`max-w-md text-center text-xs leading-relaxed sm:text-right ${ui.muted}`}>
            Non-custodial. Not financial advice. {BRAND.fullName} never asks
            for your seed phrase.
          </p>
        </div>
        <p className="mt-8 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} {BRAND.fullName}
        </p>
      </div>
    </footer>
  );
}
