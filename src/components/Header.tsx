"use client";

import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";
import { ui } from "@/lib/ui";

const NAV = [
  { href: "#tool", label: "Tool" },
  { href: "#recent-claims", label: "Activity" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-full border border-white/[0.08] bg-[#070708]/75 px-4 shadow-soft backdrop-blur-xl sm:px-5">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-50"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <ConnectWallet
          showSecondary={false}
          className={`${ui.btnPrimary} !min-h-[36px] !rounded-full !px-4 !py-2 !text-xs sm:!text-sm`}
        />
      </div>
    </header>
  );
}
