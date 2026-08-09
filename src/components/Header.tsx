"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-surface/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Logo />

        <nav className="hidden md:flex items-center gap-8 text-sm text-surface-muted">
          <a href="#tool" className="hover:text-white transition-colors">
            Reclaim
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors">
            How it works
          </a>
          <a href="#faq" className="hover:text-white transition-colors">
            FAQ
          </a>
        </nav>

        <div className="shrink-0">
          <ConnectWallet className="btn-primary !px-4 !py-2.5 !min-h-[40px] !text-xs sm:!text-sm" />
        </div>
      </div>
    </header>
  );
}
