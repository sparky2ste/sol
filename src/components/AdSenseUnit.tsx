"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT } from "@/lib/adsense/config";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

interface AdSenseUnitProps {
  className?: string;
}

/**
 * Responsive display unit. Placed below the wallet tool so reclaim/burn UX stays clean.
 * Set NEXT_PUBLIC_ADSENSE_SLOT after creating an ad unit in the AdSense dashboard.
 */
export function AdSenseUnit({ className = "" }: AdSenseUnitProps) {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (!ADSENSE_SLOT || pushedRef.current) return;

    const pushAd = () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch {
        // Ad blockers or AdSense still loading.
      }
    };

    if (window.adsbygoogle) {
      pushAd();
      return;
    }

    const interval = window.setInterval(() => {
      if (!window.adsbygoogle) return;
      window.clearInterval(interval);
      pushAd();
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  if (!ADSENSE_SLOT) {
    return null;
  }

  return (
    <aside
      className={`overflow-hidden ${className}`}
      aria-label="Advertisement"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800/50 bg-zinc-900/25 px-2 py-3">
        <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-zinc-600">
          Sponsored
        </p>
        <ins
          className="adsbygoogle block min-h-[90px] w-full"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
