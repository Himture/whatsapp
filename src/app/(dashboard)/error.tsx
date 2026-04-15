"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DashboardErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function DashboardError({ error, unstable_retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius-comfortable)] bg-danger/10" aria-hidden="true">
          <span className="text-xl text-danger">!</span>
        </div>
        <h2 className="text-lg font-bold text-near-black">
          Something went wrong
        </h2>
        <p className="text-sm text-warm-500">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-warm-500 font-mono">Reference: {error.digest}</p>
        )}
        <Button variant="primary" size="sm" onClick={unstable_retry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
