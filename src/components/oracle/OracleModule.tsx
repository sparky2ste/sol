"use client";

import { useRef, useState } from "react";
import type { OracleReport } from "@/lib/oracle/types";
import { parseMintInput } from "@/lib/oracle/parseMint";
import { truncateAddress } from "@/lib/format";
import { ui } from "@/lib/ui";

function formatUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

const RATING_STYLE: Record<
  OracleReport["verdict"]["rating"],
  { label: string; className: string }
> = {
  avoid: { label: "Avoid", className: "bg-red-500/15 text-red-300 ring-red-500/30" },
  caution: {
    label: "Caution",
    className: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  },
  neutral: {
    label: "Neutral",
    className: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  },
  bullish: {
    label: "Bullish",
    className: "bg-[#14F195]/15 text-[#14F195] ring-[#14F195]/30",
  },
  degen: {
    label: "Degen",
    className: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  },
};

export function OracleModule() {
  const [mint, setMint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<OracleReport | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    const ca = parseMintInput(mint);
    if (!ca) {
      setError("Paste a token mint address or DexScreener / Solscan link.");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch(`/api/oracle?mint=${encodeURIComponent(ca)}`, {
        cache: "no-store",
      });

      let data: { message?: string; error?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error("Server error — try again in a moment.");
      }

      if (!res.ok) {
        if (res.status === 429) {
          const retry = res.headers.get("Retry-After");
          throw new Error(
            retry
              ? `Rate limited — wait ${retry}s and try again.`
              : (data.message ?? "Too many requests. Wait a moment and retry.")
          );
        }
        throw new Error(data.message ?? "Analysis failed");
      }

      if (!data || typeof data !== "object" || !("verdict" in data)) {
        throw new Error("Unexpected response from Oracle. Try again.");
      }

      setReport(data as OracleReport);
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={analyze} className="glass-card p-5 sm:p-6">
        <label className={`mb-2 block text-xs font-medium uppercase tracking-wider ${ui.muted}`}>
          Token contract (CA)
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            placeholder="Paste Solana mint address…"
            className="min-h-[48px] flex-1 rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={loading || !mint.trim()}
            className={`${ui.btnPrimary} min-h-[48px] shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500`}
          >
            {loading ? "Scanning…" : "Run Oracle"}
          </button>
        </div>
        <p className={`mt-3 text-xs ${ui.muted}`}>
          Paste the <strong className="text-zinc-400">token mint (CA)</strong>,
          a DexScreener link, or Solscan token URL — not your wallet address.
        </p>
      </form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/25 bg-red-500/8 p-4 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="glass-card flex flex-col items-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-400" />
          <p className={ui.muted}>Reading chain, holders, and market…</p>
          <p className="mt-2 text-xs text-zinc-600">Usually takes 5–15 seconds</p>
        </div>
      )}

      <div ref={resultsRef}>
        {report && !loading && <OracleReportView report={report} />}
      </div>
    </div>
  );
}

function OracleReportView({ report }: { report: OracleReport }) {
  const rating = RATING_STYLE[report.verdict.rating];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="glass-card overflow-hidden">
        <div className="relative bg-gradient-to-br from-violet-600/10 via-transparent to-fuchsia-600/10 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {report.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={report.imageUrl}
                alt=""
                className="h-16 w-16 rounded-2xl border border-zinc-700 bg-zinc-900 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-2xl">
                🔮
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-zinc-50">
                  {report.symbol}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${rating.className}`}
                >
                  {rating.label}
                </span>
              </div>
              <p className={`text-sm ${ui.muted}`}>{report.name}</p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {truncateAddress(report.mint, 8)}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                Oracle confidence
              </p>
              <p className="font-display text-5xl font-bold tabular-nums text-violet-300">
                {report.verdict.confidence}
                <span className="text-lg text-zinc-500">/10</span>
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-zinc-300">
            {report.verdict.summary}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {report.verdict.opinion}
          </p>
        </div>
      </div>

      {report.market && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Market cap" value={formatUsd(report.market.marketCapUsd)} />
          <StatCard label="Liquidity" value={formatUsd(report.market.liquidityUsd)} />
          <StatCard
            label="24h volume"
            value={formatUsd(report.market.volume24hUsd)}
          />
          <StatCard
            label="24h change"
            value={`${report.market.priceChange24h >= 0 ? "+" : ""}${report.market.priceChange24h.toFixed(1)}%`}
            accent={
              report.market.priceChange24h >= 0
                ? "text-[#14F195]"
                : "text-red-400"
            }
          />
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">
          Mcap prediction ({report.verdict.mcapPrediction.horizon})
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <PredictionCard
            label="Floor"
            value={formatUsd(report.verdict.mcapPrediction.lowUsd)}
            tone="zinc"
          />
          <PredictionCard
            label="Base case"
            value={formatUsd(report.verdict.mcapPrediction.midUsd)}
            tone="violet"
          />
          <PredictionCard
            label="Upside"
            value={formatUsd(report.verdict.mcapPrediction.highUsd)}
            tone="fuchsia"
          />
        </div>
        <p className={`mt-3 text-xs ${ui.muted}`}>
          Speculative model from liquidity, holders, momentum, and social signals
          — not a guarantee.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SignalGrid signals={report.signals} />
        <HolderPanel report={report} />
      </div>

      {report.bundlerSignals.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">
            Bundler / sniper flags
          </h3>
          <ul className="space-y-2">
            {report.bundlerSignals.map((b) => (
              <li
                key={b.address}
                className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs text-orange-200">
                  {truncateAddress(b.address, 6)}
                </span>
                <span className="text-orange-300/80"> · {b.percent.toFixed(1)}%</span>
                <p className="mt-0.5 text-xs text-zinc-500">{b.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ListPanel title="Risks" items={report.risks} tone="red" />
        <ListPanel title="Opportunities" items={report.opportunities} tone="green" />
      </div>

      {report.socialMentions.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">
            Social & mentions
          </h3>
          <div className="flex flex-wrap gap-2">
            {report.socialMentions.map((m) => (
              <a
                key={`${m.platform}-${m.url}`}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-violet-500/40 hover:text-zinc-50"
              >
                <span className="capitalize text-violet-400">{m.platform}</span>
                {m.handle}
                {m.source === "search" && (
                  <span className="text-zinc-600">· search</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {report.topHolders.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="border-b border-zinc-800 px-5 py-3">
            <h3 className="font-display font-semibold">Top holders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className={`border-b border-zinc-800 text-left text-xs ${ui.muted}`}>
                  <th className="px-5 py-2 font-normal">Wallet</th>
                  <th className="px-4 py-2 font-normal">%</th>
                  <th className="px-5 py-2 font-normal">Tags</th>
                </tr>
              </thead>
              <tbody>
                {report.topHolders.map((h) => (
                  <tr
                    key={h.address}
                    className="border-b border-zinc-800/60 last:border-0"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs">
                      <a
                        href={`https://solscan.io/account/${h.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-50"
                      >
                        {truncateAddress(h.address, 6)}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{h.percent.toFixed(2)}%</td>
                    <td className="px-5 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {h.tags.length === 0 ? (
                          <span className={ui.muted}>—</span>
                        ) : (
                          h.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                            >
                              {t}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-zinc-600">{report.disclaimer}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="glass-card p-4">
      <p className={`text-xs ${ui.muted}`}>{label}</p>
      <p className={`font-display text-xl font-semibold tabular-nums ${accent ?? "text-zinc-50"}`}>
        {value}
      </p>
    </div>
  );
}

function PredictionCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "zinc" | "violet" | "fuchsia";
}) {
  const colors = {
    zinc: "border-zinc-700 text-zinc-300",
    violet: "border-violet-500/30 text-violet-300",
    fuchsia: "border-fuchsia-500/30 text-fuchsia-300",
  };
  return (
    <div className={`rounded-xl border bg-zinc-950/40 p-4 ${colors[tone]}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function SignalGrid({
  signals,
}: {
  signals: OracleReport["signals"];
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 font-display text-lg font-semibold">Signal scores</h3>
      <div className="space-y-3">
        {signals.map((s) => (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className={ui.muted}>{s.label}</span>
              <span className="font-medium text-violet-300">
                {s.score}/{s.max}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                style={{ width: `${(s.score / s.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HolderPanel({ report }: { report: OracleReport }) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 font-display text-lg font-semibold">Holder map</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="Top 10 hold" value={`${report.top10Percent.toFixed(1)}%`} />
        <Metric label="Dev-linked" value={`${report.devHoldPercent.toFixed(1)}%`} />
        <Metric label="LP / pools" value={`${report.lpHoldPercent.toFixed(1)}%`} />
        <Metric label="Bot-like cluster" value={`${report.botLikePercent.toFixed(0)}%`} />
        <Metric
          label="Mint renounced"
          value={report.mintRenounced ? "Yes" : "No"}
          warn={!report.mintRenounced}
        />
        <Metric
          label="Freeze renounced"
          value={report.freezeRenounced ? "Yes" : "No"}
          warn={!report.freezeRenounced}
        />
      </dl>
    </div>
  );
}

function Metric({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className={`font-semibold tabular-nums ${warn ? "text-amber-400" : "text-zinc-100"}`}>
        {value}
      </dd>
    </div>
  );
}

function ListPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "green";
}) {
  const icon = tone === "red" ? "⚠" : "✦";
  const color = tone === "red" ? "text-red-300/90" : "text-[#14F195]/90";
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 font-display text-lg font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className={`flex gap-2 text-sm leading-relaxed ${color}`}>
            <span className="shrink-0 opacity-60">{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
