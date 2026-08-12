import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LogoIcon } from "@/components/LogoIcon";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-[15px]", gap: "gap-2" },
    md: { icon: "h-8 w-8", text: "text-base", gap: "gap-2.5" },
    lg: { icon: "h-10 w-10", text: "text-lg", gap: "gap-3" },
  };
  const s = sizes[size];

  return (
    <Link href="/" className={`flex items-center ${s.gap}`}>
      <LogoIcon className={s.icon} />
      <span className={`font-display font-semibold tracking-tight ${s.text}`}>
        {BRAND.name}
      </span>
    </Link>
  );
}
