"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius-comfortable)] bg-danger/10">
          <span className="text-xl text-danger">!</span>
        </div>
        <h2 className="text-lg font-bold text-near-black">
          Something went wrong
        </h2>
        <p className="text-sm text-warm-500">
          An unexpected error occurred. Please try again.
        </p>
        <Button variant="primary" size="sm" onClick={reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
