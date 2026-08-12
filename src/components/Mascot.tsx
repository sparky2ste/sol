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
  hero: { box: "h-52 w-52 sm:h-64 sm:w-64 lg:h-72 lg:w-72", dim: 288 },
};

export function Mascot({
  className = "",
  size = "md",
  priority = false,
}: MascotProps) {
  const s = sizes[size];

  return (
    <div className={`relative mx-auto ${s.box} ${className}`} aria-hidden>
      <Image
        src="/mascot.png"
        alt=""
        width={s.dim}
        height={s.dim}
        priority={priority}
        unoptimized
        className="h-full w-full object-contain"
      />
    </div>
  );
}
