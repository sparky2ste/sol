"use client";

import { AnimateIn } from "@/components/AnimateIn";
import { Mascot } from "@/components/Mascot";
import { ui } from "@/lib/ui";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-2 pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <AnimateIn>
            <p className={`${ui.sectionEyebrow} mb-5`}>Solana rent recovery</p>
          </AnimateIn>

          <AnimateIn delay={60}>
            <h1
              className={`${ui.heading} mx-auto mb-6 max-w-xl text-[2.35rem] leading-[1.06] sm:text-5xl lg:mx-0 lg:max-w-none lg:text-[3.4rem]`}
            >
              Get your locked SOL back from{" "}
              <span className={ui.accent}>empty token accounts</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={120}>
            <p
              className={`mx-auto mb-8 max-w-md text-base leading-relaxed sm:text-[17px] lg:mx-0 ${ui.muted}`}
            >
              Scan your wallet, close vacant accounts, and recover rent in one
              signed transaction. No seed phrase. You stay in control.
            </p>
          </AnimateIn>

          <AnimateIn delay={180}>
            <div className="mb-9 flex flex-col items-center gap-4 sm:flex-row lg:items-start lg:justify-start">
              <a href="#tool" className={ui.btnPrimary}>
                Scan wallet
              </a>
              <p className={`text-sm ${ui.muted}`}>
                Non-custodial · 1% fee · $0 upfront
              </p>
            </div>
          </AnimateIn>
        </div>

        <AnimateIn delay={100} className="flex justify-center lg:justify-end">
          <div className="relative">
            <div
              aria-hidden
              className="absolute inset-0 scale-90 rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.12),transparent_68%)] blur-3xl"
            />
            <Mascot size="hero" priority />
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
