import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const BADGE_VARIANTS = {
  default: "bg-badge-bg text-badge-text",
  success: "bg-[#e8f5f4] text-success",
  warning: "bg-[#fff3eb] text-warning",
  danger: "bg-[#fef2f2] text-danger",
  neutral: "bg-warm-white text-warm-500",
} as const;

type BadgeVariant = keyof typeof BADGE_VARIANTS;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-pill)] px-2 py-0.5",
        "text-xs font-semibold leading-tight tracking-[0.125px]",
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
