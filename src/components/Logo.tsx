export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: "w-8 h-8", icon: "w-4 h-4", text: "text-base" },
    md: { box: "w-10 h-10", icon: "w-5 h-5", text: "text-lg" },
    lg: { box: "w-12 h-12", icon: "w-6 h-6", text: "text-xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.box} rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow`}
      >
        <svg
          className={s.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L4 7v10l8 5 8-5V7l-8-5z"
            stroke="#06060a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M12 8v8M8 10l4 2 4-2"
            stroke="#06060a"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <span className={`font-display font-bold tracking-tight ${s.text}`}>
          SOL Reclaim
        </span>
        {size !== "sm" && (
          <p className="text-[11px] text-surface-muted leading-none mt-0.5 hidden sm:block">
            Wallet rent recovery
          </p>
        )}
      </div>
    </div>
  );
}
