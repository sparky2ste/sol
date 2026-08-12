"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { getAdSenseConfig } from "@/lib/adsense/config";
import { loadAdSenseScript, pushAdUnit } from "@/lib/adsense/load";

interface AdSenseUnitProps {
  className?: string;
}

function insLooksFilled(ins: HTMLElement): boolean {
  const iframe = ins.querySelector("iframe");
  if (!iframe) return false;
  const { height, width } = iframe.getBoundingClientRect();
  return height > 40 && width > 40;
}

export function AdSenseUnit({ className = "" }: AdSenseUnitProps) {
  const insRef = useRef<HTMLModElement>(null);
  const unitId = useId();
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  const config = useMemo(() => {
    if (!hostname) return null;
    return getAdSenseConfig(hostname);
  }, [hostname]);

  useEffect(() => {
    if (!config) return;

    let cancelled = false;
    let observer: MutationObserver | undefined;

    const syncStatus = () => {
      const ins = insRef.current;
      if (!ins || cancelled) return;
      if (insLooksFilled(ins)) {
        ins.dataset.adLoaded = "true";
      }
    };

    const mountAd = async () => {
      try {
        await loadAdSenseScript(config.scriptUrl);
        if (cancelled || !insRef.current) return;

        await new Promise<void>((resolve) => {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => resolve());
          });
        });

        for (let attempt = 0; attempt < 4; attempt += 1) {
          if (cancelled || !insRef.current) return;
          if (insLooksFilled(insRef.current)) return;

          pushAdUnit();
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 1000);
          });
        }
      } catch {
        /* ignore */
      }
    };

    const bind = () => {
      const ins = insRef.current;
      if (!ins) return false;
      observer = new MutationObserver(syncStatus);
      observer.observe(ins, {
        attributes: true,
        attributeFilter: ["data-ad-status"],
        childList: true,
        subtree: true,
      });
      void mountAd();
      return true;
    };

    if (!bind()) {
      const wait = () => {
        if (cancelled) return;
        if (bind()) return;
        window.requestAnimationFrame(wait);
      };
      wait();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [config]);

  return (
    <aside className={`overflow-hidden ${className}`} aria-label="Advertisement">
      <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800/50 bg-zinc-900/25 px-2 py-3">
        <p className="mb-2 text-center text-[10px] uppercase tracking-wider text-zinc-600">
          Sponsored
        </p>
        {config ? (
          <div className="flex justify-center overflow-hidden rounded-md bg-zinc-950/40">
            <ins
              ref={insRef}
              id={unitId}
              className="adsbygoogle"
              style={{ display: "inline-block", width: 728, maxWidth: "100%", height: 90 }}
              data-ad-client={config.client}
              data-ad-slot={config.slot}
            />
          </div>
        ) : (
          <div className="mx-auto h-[90px] max-w-full animate-pulse rounded bg-zinc-800/40" />
        )}
      </div>
    </aside>
  );
}
