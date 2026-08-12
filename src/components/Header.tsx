"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";
import { OnlineCounter } from "@/components/OnlineCounter";
import { ui } from "@/lib/ui";

const NAV = [
  { href: "#tool", label: "Tool" },
  { href: "#recent-claims", label: "Activity" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#0b0c14]/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-50"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <OnlineCounter />
          <ConnectWallet
            showSecondary={false}
            className={`${ui.btnPrimary} !min-h-[36px] !rounded-lg !px-4 !py-2 !text-xs sm:!text-sm`}
          />
        </div>
      </div>
    </header>
  );
}
