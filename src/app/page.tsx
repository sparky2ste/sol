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
import { AdSenseUnit } from "@/components/AdSenseUnit";
import { ui } from "@/lib/ui";

export default function Home() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <Hero />

        <section id="tool" className="pb-14">
          <div className={`${ui.card} p-6 sm:p-8`}>
            <WalletCleaner />
          </div>
        </section>

        <AdSenseUnit className="pb-10" />

        <RecentClaims />
        <ComparisonStrip />
        <HowItWorks />
        <SecuritySection />
        <FaqSection />
      </main>

      <Footer />
    </>
  );
}
