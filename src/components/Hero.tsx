"use client";

import { AnimateIn } from "@/components/AnimateIn";
import { Mascot } from "@/components/Mascot";
import { ui } from "@/lib/ui";

const TRUST_ITEMS = [
  "Non-custodial",
  "No seed phrase",
  "1% fee",
  "Empty accounts only",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden px-2 pt-12 pb-10 sm:pt-16 sm:pb-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(20,241,149,0.1),transparent_65%)]"
      />

      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div className="text-center lg:text-left">
          <AnimateIn>
            <h1
              className={`${ui.heading} mx-auto mb-5 max-w-xl text-4xl leading-[1.08] sm:text-5xl lg:mx-0 lg:max-w-none lg:text-[3.25rem]`}
            >
              Close empty accounts,{" "}
              <span className="text-[#14F195]">recover locked rent</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={100}>
            <p
              className={`mx-auto mb-8 max-w-lg text-base leading-relaxed sm:text-lg lg:mx-0 ${ui.muted}`}
            >
              Vacant SPL accounts lock SOL as rent. Scan, review, and reclaim
              in one signed transaction.
            </p>
          </AnimateIn>

          <AnimateIn delay={180}>
            <div className="mb-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {TRUST_ITEMS.map((item) => (
                <span key={item} className={ui.pill}>
                  <span className="h-1 w-1 rounded-full bg-[#14F195]" />
                  {item}
                </span>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={260}>
            <a
              href="#tool"
              className={`${ui.btnPrimary} px-8 shadow-soft`}
            >
              Get started
            </a>
          </AnimateIn>
        </div>

        <AnimateIn delay={120} className="flex justify-center lg:justify-end">
          <Mascot size="hero" priority />
        </AnimateIn>
      </div>
    </section>
  );
}
