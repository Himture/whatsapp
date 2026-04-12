"use client";

import { useState } from "react";
import type { ApiCallResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration } from "@/lib/utils";

interface ResponseViewerProps {
  result: ApiCallResult | null;
}

function getStatusVariant(status: number) {
  if (status >= 200 && status < 300) return "success" as const;
  if (status >= 400 && status < 500) return "warning" as const;
  if (status >= 500) return "danger" as const;
  return "neutral" as const;
}

export function ResponseViewer({ result }: ResponseViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(JSON.stringify(result?.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="mt-6">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-near-black">Response</span>
            <Badge variant={getStatusVariant(result.status)}>
              {result.status || "Error"}
            </Badge>
            <span className="text-xs text-warm-300">
              {formatDuration(result.duration)}
            </span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="overflow-auto rounded-[var(--radius-standard)] bg-warm-white p-4 text-sm font-mono text-near-black max-h-96 border-whisper">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}
