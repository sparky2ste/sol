export function PageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#070708]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-10%,rgba(153,69,255,0.07),transparent_55%),radial-gradient(ellipse_55%_45%_at_100%_20%,rgba(20,241,149,0.05),transparent_50%),radial-gradient(ellipse_45%_35%_at_0%_70%,rgba(20,241,149,0.04),transparent_45%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:72px_72px] [mask-image:radial-gradient(ellipse_85%_70%_at_50%_30%,black_15%,transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,#070708_88%)]" />
    </div>
  );
}
