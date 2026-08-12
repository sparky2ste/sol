import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";
import { CommunityGoals } from "@/components/CommunityGoals";
import { Footer } from "@/components/Sections";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

export const metadata: Metadata = {
  title: `Leaderboard | ${BRAND.fullName}`,
  description:
    "Top wallets by SOL recovered through reclaims and burns on SOL Reclaim.",
};

export default function LeaderboardPage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <h1 className={`${ui.heading} text-3xl sm:text-4xl`}>Leaderboard</h1>
          <p className={`mt-3 max-w-xl text-sm leading-relaxed ${ui.muted}`}>
            Wallets ranked by total SOL recovered from reclaims and burns.
            Totals are estimated from on-chain fee payments to {BRAND.fullName}.
          </p>
        </div>

        <CommunityGoals className="mb-8" compact showHeader />

        <Leaderboard />
      </main>

      <Footer />
    </>
  );
}
