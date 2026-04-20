import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevated?: boolean;
  variant?: "default" | "featured";
}

export function Card({ className, children, elevated = false, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border-whisper",
        variant === "featured"
          ? "rounded-[var(--radius-large)]"
          : "rounded-[var(--radius-comfortable)]",
        elevated ? "shadow-deep" : "shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 pb-6 pt-0 flex items-center gap-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[22px] font-bold leading-tight tracking-[-0.25px] text-near-black",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-base text-warm-500 mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}
