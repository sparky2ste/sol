import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { OracleModule } from "@/components/oracle/OracleModule";
import { BRAND } from "@/lib/brand";
import { ui } from "@/lib/ui";

export const metadata: Metadata = {
  title: `Oracle | ${BRAND.fullName}`,
  description:
    "Paste a Solana memecoin CA for holder analysis, bundler heuristics, social links, and a speculative mcap outlook.",
};

export default function OraclePage() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 text-center sm:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <span aria-hidden>🔮</span>
            Memecoin Oracle
          </div>
          <h1 className={`${ui.heading} text-3xl sm:text-4xl`}>
            Memecoin{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              read
            </span>
          </h1>
          <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed sm:mx-0 ${ui.muted}`}>
            Drop a contract address. Oracle pulls on-chain data and market stats,
            then an AI model reads the chart, holders, and narrative (Trump,
            SpaceX, Ansem-style catalysts) for a straight take and mcap range.
          </p>
        </div>

        <OracleModule />
      </main>

      <Footer />
    </>
  );
}
