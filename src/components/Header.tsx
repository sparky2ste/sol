"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectWallet } from "@/components/ConnectWallet";
import { Logo } from "@/components/Logo";
import { OnlineCounter } from "@/components/OnlineCounter";
import { ui } from "@/lib/ui";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/oracle", label: "Oracle" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-[#0b0c14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-6 sm:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative text-sm transition-colors ${
                  active
                    ? "font-medium text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-[17px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#14F195] to-transparent transition-all duration-300 ${
                    active
                      ? "opacity-100 shadow-[0_0_8px_rgba(20,241,149,0.6)]"
                      : "opacity-0 group-hover:opacity-40"
                  }`}
                />
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
