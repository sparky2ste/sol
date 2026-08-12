export const ui = {
  page: "text-zinc-50",
  section: "border-t border-zinc-800/80 py-16 sm:py-20",
  sectionEyebrow: "mb-2 text-xs font-semibold text-[#14F195]/80",
  card: "rounded-xl border border-zinc-800 bg-zinc-900/50",
  cardPad: "rounded-xl border border-zinc-800 bg-zinc-900/50 p-6",
  label: "text-xs font-medium text-zinc-500",
  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#14F195] px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-[0_8px_28px_-8px_rgba(20,241,149,0.5)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0fd68a] hover:shadow-[0_12px_36px_-8px_rgba(20,241,149,0.65)] active:translate-y-0 active:bg-[#0bb574] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0",
  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-4 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-white active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0",
  pill: "inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500",
  muted: "text-zinc-500",
  heading: "font-display font-semibold tracking-tight text-zinc-50",
  accent: "text-[#14F195]",
} as const;
