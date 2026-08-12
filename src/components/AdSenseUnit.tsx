"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_SCRIPT,
  ADSENSE_SLOT,
} from "@/lib/adsense/config";

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

const pushedSlots = new Set<string>();

interface AdSenseUnitProps {
  className?: string;
  slot?: string;
}

function pushAdSlot(slot: string) {
  if (pushedSlots.has(slot)) return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    pushedSlots.add(slot);
  } catch {
    // Blocked by ad blocker or script not ready.
  }
}

export function AdSenseUnit({
  className = "",
  slot = ADSENSE_SLOT,
}: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [showFrame, setShowFrame] = useState(true);

  const tryPush = useCallback(() => {
    if (!slot || !insRef.current) return;
    window.requestAnimationFrame(() => {
      pushAdSlot(slot);
    });
  }, [slot]);

  useEffect(() => {
    if (!scriptReady) return;
    tryPush();
  }, [scriptReady, tryPush]);

  useEffect(() => {
    const ins = insRef.current;
    if (!ins) return;

    const hideIfEmpty = () => {
      const status = ins.getAttribute("data-ad-status");
      if (status === "unfilled") {
        setShowFrame(false);
      }
    };

    hideIfEmpty();

    const observer = new MutationObserver(hideIfEmpty);
    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
    });

    const timeout = window.setTimeout(hideIfEmpty, 4000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [slot]);

  if (!slot) return null;

  return (
    <>
      <Script
        id={`adsense-${slot}`}
        async
        src={ADSENSE_SCRIPT}
        crossOrigin="anonymous"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {showFrame && (
        <aside
          className={`overflow-hidden ${className}`}
          aria-label="Advertisement"
        >
          <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800/50 bg-zinc-900/25 px-2 py-3">
            <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-zinc-600">
              Sponsored
            </p>
            <ins
              ref={insRef}
              className="adsbygoogle block min-h-[100px] w-full"
              style={{ display: "block" }}
              data-ad-client={ADSENSE_CLIENT}
              data-ad-slot={slot}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </aside>
      )}
    </>
  );
}
