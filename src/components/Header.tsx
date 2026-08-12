"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";
import { OnlineCounter } from "@/components/OnlineCounter";
import { ui } from "@/lib/ui";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-[#0b0c14]/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="flex items-center gap-4 sm:gap-6">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  active
                    ? "font-medium text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
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
