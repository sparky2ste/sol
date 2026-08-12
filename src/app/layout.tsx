import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
import { AdSenseScript } from "@/components/AdSenseScript";
import { PageBackground } from "@/components/PageBackground";
import { BRAND } from "@/lib/brand";
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
    "Non-custodial Solana utility to close empty SPL token accounts and recover rent. No seed phrase. You review and sign every transaction in Phantom or Solflare.",
  openGraph: {
    title: `${BRAND.fullName} | Empty Token Account Cleaner`,
    description:
      "Close vacant SPL accounts and recover locked SOL. Non-custodial. 1% fee on reclaimed rent only.",
    type: "website",
    siteName: BRAND.fullName,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/logo.svg" },
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
        <AdSenseScript />
        <PageBackground />
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
