"use client";

import { useEffect, useRef, useState } from "react";
import { formatSol, truncateAddress } from "@/lib/solana/constants";
import { ui } from "@/lib/ui";

export type SuccessKind = "reclaim" | "burn";

const COPY: Record<
  SuccessKind,
  { title: string; subtitle: string; cta: string }
> = {
  reclaim: {
    title: "SOL reclaimed!",
    subtitle: "Thanks for using SOL Reclaim. Your rent is back in your wallet.",
    cta: "Come again anytime",
  },
  burn: {
    title: "Burn complete!",
    subtitle: "Thanks! Tokens burned and locked rent recovered to your wallet.",
    cta: "Come again anytime",
  },
};

export function SuccessCelebration({
  kind,
  signatures,
  amountLamports,
  onDismiss,
}: {
  kind: SuccessKind;
  signatures: string[];
  amountLamports?: number;
  onDismiss: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const copy = COPY[kind];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) void video.play();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md"
        onClick={onDismiss}
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className={`${ui.card} overflow-hidden border-[#14F195]/25 shadow-soft`}>
          <div className="relative bg-zinc-950">
            <video
              ref={videoRef}
              src="/success-celebration.webm"
              autoPlay
              loop
              muted
              playsInline
              className="mx-auto aspect-square w-full max-h-64 object-contain"
            />
            <button
              type="button"
              onClick={toggleSound}
              className="absolute bottom-3 right-3 rounded-full border border-zinc-700 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              {muted ? "Unmute" : "Mute"}
            </button>
          </div>

          <div className="space-y-4 p-6 text-center">
            <div>
              <p className={`${ui.label} mb-2`}>Success</p>
              <h2
                id="success-title"
                className={`${ui.heading} text-2xl text-[#14F195]`}
              >
                {copy.title}
              </h2>
              <p className={`mt-2 text-sm leading-relaxed ${ui.muted}`}>
                {copy.subtitle}
              </p>
            </div>

            {amountLamports != null && amountLamports > 0 && (
              <div className="rounded-xl border border-[#14F195]/20 bg-[#14F195]/8 px-4 py-3">
                <p className="text-xs text-zinc-500">You received</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-[#14F195]">
                  {formatSol(amountLamports)} SOL
                </p>
              </div>
            )}

            {signatures.length > 0 && (
              <div className="space-y-1.5">
                {signatures.map((sig) => (
                  <a
                    key={sig}
                    href={`https://solscan.io/tx/${sig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block font-mono text-xs transition-colors hover:text-[#14F195] ${ui.muted}`}
                  >
                    View on Solscan → {truncateAddress(sig, 8)}
                  </a>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={onDismiss}
              className={`${ui.btnPrimary} w-full`}
            >
              {copy.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
