"use client";

import { AnimateIn } from "@/components/AnimateIn";
import { ui } from "@/lib/ui";

const TRUST_ITEMS = [
  "Non-custodial",
  "No seed phrase",
  "1% fee",
  "Empty accounts only",
];

export function Hero() {
  return (
    <section className="relative px-2 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-72 max-w-3xl bg-[radial-gradient(ellipse_at_center,rgba(20,241,149,0.14),transparent_70%)] blur-2xl"
      />

      <AnimateIn>
        <p className={`${ui.label} mb-4`}>Solana wallet utility</p>
      </AnimateIn>

      <AnimateIn delay={80}>
        <h1
          className={`${ui.heading} mx-auto mb-6 max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl`}
        >
          Close empty token accounts,{" "}
          <span className="text-[#14F195]">recover locked rent</span>
        </h1>
      </AnimateIn>

      <AnimateIn delay={160}>
        <p className={`mx-auto mb-10 max-w-xl text-base leading-relaxed sm:text-lg ${ui.muted}`}>
          Scan your wallet for vacant SPL accounts, review the breakdown, and
          reclaim SOL in one signed transaction.
        </p>
      </AnimateIn>

      <AnimateIn delay={240}>
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {TRUST_ITEMS.map((item) => (
            <span key={item} className={ui.pill}>
              <span className="h-1 w-1 rounded-full bg-[#14F195]" />
              {item}
            </span>
          ))}
        </div>
      </AnimateIn>

      <AnimateIn delay={320}>
        <a href="#tool" className={`${ui.btnPrimary} px-8 shadow-soft`}>
          Get started
        </a>
      </AnimateIn>
    </section>
  );
}
