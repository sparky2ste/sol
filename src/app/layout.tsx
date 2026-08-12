import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import { PageBackground } from "@/components/PageBackground";
import { BRAND } from "@/lib/brand";
import { ADSENSE_CLIENT } from "@/lib/adsense/config";
import "./globals.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: `${BRAND.fullName} | Close Empty Token Accounts`,
  description:
    "Non-custodial Solana utility to close empty SPL token accounts and recover rent. Phantom, Solflare, Coinbase Wallet, and Trust supported.",
  openGraph: {
    title: `${BRAND.fullName} | Empty Token Account Cleaner`,
    description:
      "Close vacant SPL accounts and recover locked SOL. Non-custodial. 1% fee on reclaimed rent only.",
    type: "website",
    siteName: BRAND.fullName,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo.svg" },
  other: {
    "google-adsense-account": ADSENSE_CLIENT,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={`${inter.className} min-h-screen antialiased`}>
        <PageBackground />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
