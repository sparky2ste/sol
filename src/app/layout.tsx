import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "SOL Reclaim — Recover Locked SOL from Empty Token Accounts",
  description:
    "Professional non-custodial Solana wallet cleaner. Reclaim SOL locked in empty token accounts. 1% fee deducted from payout. Zero upfront cost.",
  keywords: ["Solana", "wallet cleaner", "SOL reclaim", "memecoin", "rent recovery"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: "#06060a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        <div className="relative min-h-screen overflow-x-hidden">
          <div className="pointer-events-none fixed inset-0 -z-10">
            <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-accent-400/20 blur-[120px]" />
            <div className="absolute top-[30%] right-[-15%] h-[400px] w-[400px] rounded-full bg-brand-400/15 blur-[100px]" />
            <div className="absolute bottom-[-10%] left-[20%] h-[350px] w-[350px] rounded-full bg-accent-500/10 blur-[90px]" />
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-40" />
          </div>
          <ClientProviders>{children}</ClientProviders>
        </div>
      </body>
    </html>
  );
}
