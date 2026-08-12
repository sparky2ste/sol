"use client";

import { useEffect, useState } from "react";

const HEARTBEAT_MS = 30_000;
const VISITOR_STORAGE_KEY = "sr_presence_id";

function getVisitorId(): string {
  const existing = sessionStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(VISITOR_STORAGE_KEY, id);
  return id;
}

export function OnlineCounter() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const visitorId = getVisitorId();

    async function heartbeat() {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: visitorId }),
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { online?: number };
        if (!cancelled && typeof data.online === "number") {
          setOnline(data.online);
        }
      } catch {
        // Ignore transient network errors.
      }
    }

    void heartbeat();
    const interval = setInterval(() => void heartbeat(), HEARTBEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (online === null) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-[11px] text-zinc-400 sm:px-3 sm:text-xs"
      aria-live="polite"
      aria-label={`${online} people online`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F195] opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#14F195]" />
      </span>
      <span className="tabular-nums">
        <span className="font-medium text-zinc-200">{online}</span> online
      </span>
    </div>
  );
}
