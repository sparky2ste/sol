import { AnimateIn } from "@/components/AnimateIn";
import { Logo } from "@/components/Logo";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

const STEPS = [
  {
    num: "01",
    title: "Connect wallet",
    desc: "Phantom or Solflare. Keys never leave your browser.",
  },
  {
    num: "02",
    title: "Scan accounts",
    desc: "We find empty SPL and Token-2022 accounts only.",
  },
  {
    num: "03",
    title: "Claim SOL",
    desc: "Review the breakdown, sign once, receive your SOL.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className={ui.section}>
      <AnimateIn>
        <div className="mb-10 max-w-lg">
          <p className={ui.sectionEyebrow}>How it works</p>
          <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>
            Three steps to recover rent
          </h2>
        </div>
      </AnimateIn>

      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <AnimateIn key={step.num} delay={index * 100}>
            <div className={`${ui.card} h-full p-6`}>
              <span className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] font-mono text-[11px] text-zinc-400">
                {step.num}
              </span>
              <h3 className="mb-2 font-medium text-zinc-100">{step.title}</h3>
              <p className={`text-sm leading-relaxed ${ui.muted}`}>{step.desc}</p>
            </div>
          </AnimateIn>
        ))}
      </div>
    </section>
  );
}

export function ComparisonStrip() {
  return (
    <section className="py-10">
      <AnimateIn>
        <div
          className={`${ui.card} flex flex-col items-center justify-between gap-6 px-6 py-5 sm:flex-row sm:px-8`}
        >
          <div className="text-center sm:text-left">
            <p className={`${ui.sectionEyebrow} mb-1`}>Pricing</p>
            <p className={`text-sm ${ui.muted}`}>Simple, transparent fees</p>
          </div>
          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:gap-10">
            <div className="text-center sm:text-right">
              <p className={`${ui.heading} text-3xl ${ui.accent}`}>1%</p>
              <p className={`mt-0.5 text-xs ${ui.muted}`}>on reclaimed SOL</p>
            </div>
            <div className="hidden w-px bg-white/[0.08] sm:block" />
            <div className="text-center sm:text-right">
              <p className={`${ui.heading} text-3xl`}>$0</p>
              <p className={`mt-0.5 text-xs ${ui.muted}`}>upfront cost</p>
            </div>
          </div>
        </div>
      </AnimateIn>
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
      <AnimateIn>
        <div className="mb-8 max-w-lg">
          <p className={ui.sectionEyebrow}>Security</p>
          <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>
            Built to stay non-custodial
          </h2>
        </div>
      </AnimateIn>

      <AnimateIn delay={100}>
        <div className={`${ui.card} p-6 sm:p-8`}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <li key={item} className={`flex gap-3 text-sm ${ui.muted}`}>
                <svg
                  className={`mt-0.5 h-4 w-4 shrink-0 ${ui.accent}`}
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
      </AnimateIn>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-white/[0.06]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo size="sm" />
          <p className={`max-w-sm text-center text-xs sm:text-right ${ui.muted}`}>
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
