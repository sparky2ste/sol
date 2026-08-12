"use client";

import { Mascot } from "@/components/Mascot";
import { ui } from "@/lib/ui";

export function Hero() {
  return (
    <section className="px-2 pt-12 pb-10 sm:pt-16 sm:pb-12">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="text-center lg:text-left">
          <h1
            className={`${ui.heading} mx-auto mb-5 max-w-xl text-4xl leading-tight sm:text-5xl lg:mx-0`}
          >
            Recover SOL from{" "}
            <span className={ui.accent}>empty token accounts</span>
          </h1>

          <p className={`mx-auto mb-8 max-w-md text-base leading-relaxed lg:mx-0 ${ui.muted}`}>
            Connect your wallet, scan for vacant accounts, and reclaim locked
            rent in one transaction.
          </p>

          <a href="#tool" className={ui.btnPrimary}>
            Get started
          </a>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Mascot size="hero" priority />
        </div>
      </div>
    </section>
  );
}
