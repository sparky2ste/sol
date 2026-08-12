import Image from "next/image";

type MascotProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
  priority?: boolean;
};

const sizes = {
  sm: { box: "h-24 w-24", dim: 96 },
  md: { box: "h-36 w-36 sm:h-44 sm:w-44", dim: 176 },
  lg: { box: "h-48 w-48 sm:h-56 sm:w-56", dim: 224 },
  hero: { box: "h-56 w-56 sm:h-72 sm:w-72 lg:h-80 lg:w-80", dim: 320 },
};

export function Mascot({
  className = "",
  size = "md",
  priority = false,
}: MascotProps) {
  const s = sizes[size];

  return (
    <div
      className={`relative mx-auto ${s.box} ${className}`}
      aria-hidden
    >
      <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(20,241,149,0.1),transparent_70%)] blur-2xl" />
      <Image
        src="/mascot.png"
        alt=""
        width={s.dim}
        height={s.dim}
        priority={priority}
        unoptimized
        className="relative z-10 h-full w-full animate-float object-contain drop-shadow-[0_12px_40px_rgba(20,241,149,0.18)]"
      />
    </div>
  );
}
