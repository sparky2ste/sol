import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FaqSection } from "@/components/FaqSection";
import { RecentClaims } from "@/components/RecentClaims";
import { AnimateIn } from "@/components/AnimateIn";
import {
  HowItWorks,
  ComparisonStrip,
  Footer,
  SecuritySection,
} from "@/components/Sections";
import { WalletCleaner } from "@/components/WalletCleaner";
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <Hero />

        <AnimateIn>
          <section id="tool" className="pb-16">
            <div className="mb-5 text-center sm:text-left">
              <p className={`${ui.sectionEyebrow} uppercase tracking-widest`}>
                Wallet tool
              </p>
              <h2 className={`${ui.heading} text-2xl sm:text-3xl`}>
                Scan · Reclaim · Burn
              </h2>
            </div>

            <div className="glass-card overflow-hidden p-5 sm:p-6">
              <WalletCleaner />
            </div>
          </section>
        </AnimateIn>

        <AnimateIn delay={150}>
          <AdSenseUnit className="pb-12" />
        </AnimateIn>

        <AnimateIn delay={200}>
          <RecentClaims />
        </AnimateIn>

        <AnimateIn delay={250}>
          <ComparisonStrip />
        </AnimateIn>

        <AnimateIn delay={300}>
          <HowItWorks />
        </AnimateIn>

        <AnimateIn delay={350}>
          <SecuritySection />
        </AnimateIn>

        <AnimateIn delay={400}>
          <FaqSection />
        </AnimateIn>
      </main>

      <Footer />
    </>
  );
}
