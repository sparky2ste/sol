export function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Base tint: dark navy, not flat black */}
      <div className="absolute inset-0 bg-[#0b0c14]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#12101f] via-[#0b0c14] to-[#081210]" />

      {/* Color washes */}
      <div className="absolute -left-[10%] top-[-20%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(153,69,255,0.22),transparent_68%)] blur-3xl" />
      <div className="absolute left-1/2 top-[-15%] h-[55vh] w-[70vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.16),transparent_65%)] blur-3xl" />
      <div className="absolute -right-[10%] top-[20%] h-[50vh] w-[45vw] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_68%)] blur-3xl" />
      <div className="absolute bottom-[-15%] left-[15%] h-[45vh] w-[55vw] rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.1),transparent_70%)] blur-3xl" />

      {/* Soft edge fade so content stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,#0b0c14_100%)] opacity-80" />
    </div>
  );
}
