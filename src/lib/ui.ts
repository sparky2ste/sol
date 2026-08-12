export const ui = {
  page: "bg-zinc-950 text-zinc-50",
  card: "rounded-2xl border border-zinc-800 bg-zinc-900",
  cardPad: "rounded-2xl border border-zinc-800 bg-zinc-900 p-6",
  label: "text-xs font-medium tracking-wide text-[#14F195]",
  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#14F195] px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#0fd68a] active:bg-[#0bb574] disabled:cursor-not-allowed disabled:opacity-40",
  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-40",
  pill: "inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-500",
  muted: "text-zinc-500",
  heading: "font-display font-semibold tracking-tight",
} as const;
