import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const SIZE_CLASS = {
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
} as const;

export function Spinner({ size = "md", className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-notion-blue border-t-transparent",
        SIZE_CLASS[size],
        className,
      )}
    />
  );
}

export function LoadingPage({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner label={label} />
    </div>
  );
}
