import { AnimateIn } from "@/components/AnimateIn";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FaqSection } from "@/components/FaqSection";
import { RecentClaims } from "@/components/RecentClaims";
import {
  HowItWorks,
  ComparisonStrip,
  Footer,
  SecuritySection,
} from "@/components/Sections";
import { WalletCleaner } from "@/components/WalletCleaner";
import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <Hero />

        <AnimateIn>
          <section id="tool" className="pb-14">
            <div className="mb-6 text-center sm:text-left">
              <p className={ui.sectionEyebrow}>Wallet tool</p>
              <h2 className={`${ui.heading} text-xl sm:text-2xl`}>
                Scan & reclaim
              </h2>
            </div>
            <div className={ui.cardGlow}>
              <WalletCleaner />
            </div>
          </section>
        </AnimateIn>

        <AnimateIn delay={80}>
          <RecentClaims />
        </AnimateIn>
        <ComparisonStrip />
        <HowItWorks />
        <SecuritySection />
        <FaqSection />
      </main>

      <Footer />
    </>
  );
}
