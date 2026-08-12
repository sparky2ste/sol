"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";
import { ui } from "@/lib/ui";

const NAV = [
  { href: "#tool", label: "Reclaim" },
  { href: "#recent-claims", label: "Activity" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 animate-fade-in border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 text-sm text-zinc-500 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-zinc-50"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <ConnectWallet
          className={`${ui.btnPrimary} !min-h-[36px] !px-4 !py-2 !text-xs sm:!text-sm`}
        />
      </div>
    </header>
  );
}
