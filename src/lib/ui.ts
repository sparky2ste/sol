export const ui = {
  page: "text-zinc-50",
  section: "border-t border-white/[0.06] py-16 sm:py-20",
  sectionEyebrow: "mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500",
  card: "rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-card backdrop-blur-md transition-colors duration-300 hover:border-white/[0.12]",
  cardPad:
    "rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-card backdrop-blur-md",
  cardGlow:
    "rounded-2xl border border-white/[0.1] bg-white/[0.04] p-6 shadow-glow backdrop-blur-md sm:p-8",
  label: "text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500",
  btnPrimary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#14F195] px-6 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-[#0fd68a] hover:shadow-[0_0_24px_-4px_rgba(20,241,149,0.45)] active:bg-[#0bb574] disabled:cursor-not-allowed disabled:opacity-40",
  btnSecondary:
    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:border-white/[0.18] hover:bg-white/[0.07] hover:text-white disabled:opacity-40",
  pill: "inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-zinc-400 backdrop-blur-sm",
  muted: "text-zinc-400",
  heading: "font-display font-semibold tracking-tight text-zinc-50",
  accent: "text-[#14F195]",
} as const;
