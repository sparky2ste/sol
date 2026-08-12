export function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#0b0c14]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#12101f] via-[#0b0c14] to-[#081210]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Animated orbs */}
      <div className="absolute -left-[10%] top-[-20%] h-[70vh] w-[60vw] animate-drift rounded-full bg-[radial-gradient(circle,rgba(153,69,255,0.22),transparent_68%)] blur-3xl" />
      <div className="absolute left-1/2 top-[-15%] h-[55vh] w-[70vw] -translate-x-1/2 animate-drift-reverse rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.16),transparent_65%)] blur-3xl" />
      <div className="absolute -right-[10%] top-[20%] h-[50vh] w-[45vw] animate-drift rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_68%)] blur-3xl [animation-delay:3s]" />
      <div className="absolute bottom-[-15%] left-[15%] h-[45vh] w-[55vw] animate-drift-reverse rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.1),transparent_70%)] blur-3xl [animation-delay:1.5s]" />

      {/* Aurora beams */}
      <div className="absolute left-[8%] top-0 h-[60vh] w-[26vw] origin-top animate-aurora bg-[linear-gradient(180deg,rgba(20,241,149,0.08),transparent_75%)] blur-2xl [transform:skewX(-12deg)]" />
      <div className="absolute right-[12%] top-0 h-[50vh] w-[20vw] origin-top animate-aurora bg-[linear-gradient(180deg,rgba(153,69,255,0.09),transparent_70%)] blur-2xl [animation-delay:4s] [transform:skewX(10deg)]" />

      {/* Fine noise for texture */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#0b0c14_100%)] opacity-85" />
    </div>
  );
}
