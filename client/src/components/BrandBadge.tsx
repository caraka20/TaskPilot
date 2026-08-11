import { Chip, cn } from "@heroui/react";
import { BRAND } from "./config/brand"; 

type Props = {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
};

// mapping ukuran → class util yang presisi
const SIZE = {
  sm: { chip: "px-2 py-1", logo: "h-4 w-4", name: "text-xs", tag: "text-[10px]" },
  md: { chip: "px-3 py-1.5", logo: "h-5 w-5", name: "text-sm", tag: "text-xs" },
  lg: { chip: "px-4 py-2", logo: "h-6 w-6", name: "text-base", tag: "text-sm" },
} as const;

export default function BrandBadge({
  className,
  showTagline = false,
  size = "md",
}: Props) {
  const s = SIZE[size];

  return (
    <Chip
      size={size}
      variant="flat"
      className={cn(
        "rounded-2xl shadow-sm backdrop-blur text-foreground",
        // frame & subtle gradient
        "bg-gradient-to-r from-white/40 to-white/30",
        "dark:from-white/10 dark:to-white/5",
        "border border-default-200/60",
        s.chip,
        className
      )}
      startContent={
        <div className="relative mr-1.5">
          <img
            src={BRAND.logo.dark}
            alt={BRAND.name}
            className={cn(s.logo, "object-contain")}
          />
        </div>
      }
    >
      <span className={cn("font-semibold", s.name)}>{BRAND.name}</span>
      {showTagline && BRAND.tagline && (
        <span className={cn("ml-1 opacity-80", s.tag)}>· {BRAND.tagline}</span>
      )}
    </Chip>
  );
}
