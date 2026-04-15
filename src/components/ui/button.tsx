import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANT_STYLES = {
  primary:
    "bg-notion-blue text-white border border-transparent hover:bg-active-blue active:scale-90 focus-visible:ring-2 focus-visible:ring-focus-blue",
  secondary:
    "bg-black/5 text-near-black hover:bg-black/10 hover:scale-105 active:scale-90",
  ghost:
    "bg-transparent text-near-black hover:underline active:scale-90",
  danger:
    "bg-danger text-white hover:bg-red-700 active:scale-90",
  badge:
    "bg-badge-bg text-badge-text rounded-[var(--radius-pill)] text-xs font-semibold tracking-wide px-2 py-1",
} as const;

const SIZE_STYLES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-[15px]",
  lg: "px-6 py-3 text-base",
} as const;

type ButtonVariant = keyof typeof VARIANT_STYLES;
type ButtonSize = keyof typeof SIZE_STYLES;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-micro)] font-semibold transition-all duration-150",
          "disabled:cursor-not-allowed disabled:bg-warm-100 disabled:text-warm-500 disabled:border-warm-200 disabled:hover:bg-warm-100 disabled:hover:scale-100 disabled:active:scale-100 disabled:shadow-none",
          VARIANT_STYLES[variant],
          variant !== "badge" && SIZE_STYLES[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
