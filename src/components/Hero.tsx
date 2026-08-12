import { ui } from "@/lib/ui";

const TRUST_ITEMS = [
  "Non-custodial",
  "No seed phrase",
  "1% fee",
  "Empty accounts only",
];

export function Hero() {
  return (
    <section className="px-2 pt-16 pb-12 text-center sm:pt-24 sm:pb-16">
      <h1
        className={`${ui.heading} mx-auto mb-8 max-w-3xl text-4xl leading-[1.05] sm:text-5xl lg:text-6xl`}
      >
        Close empty token accounts,{" "}
        <span className="text-[#14F195]">recover locked rent</span>
      </h1>

      <div className="mb-10 flex flex-wrap justify-center gap-2">
        {TRUST_ITEMS.map((item) => (
          <span key={item} className={ui.pill}>
            <span className="h-1 w-1 rounded-full bg-[#14F195]" />
            {item}
          </span>
        ))}
      </div>

      <a href="#tool" className={`${ui.btnPrimary} px-8`}>
        Get started
      </a>
    </section>
  );
}
