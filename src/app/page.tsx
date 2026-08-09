import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FaqSection } from "@/components/FaqSection";
import {
  HowItWorks,
  ComparisonStrip,
  Footer,
} from "@/components/Sections";
import { WalletCleaner } from "@/components/WalletCleaner";

export default function Home() {
  return (
    <>
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <Hero />

        <section id="tool" className="pb-8 animate-slide-up">
          <div className="glass-card p-6 sm:p-8 shadow-glow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/[0.06]">
              <div>
                <p className="section-label mb-2">Wallet tool</p>
                <h2 className="font-display text-2xl font-bold">
                  Scan & reclaim
                </h2>
              </div>
              <p className="text-sm text-surface-muted max-w-xs">
                Connect your wallet to scan for empty accounts and recover locked
                SOL. No signup required.
              </p>
            </div>
            <WalletCleaner />
          </div>
        </section>

        <ComparisonStrip />
        <HowItWorks />
        <FaqSection />
      </main>

      <Footer />
    </>
  );
}
