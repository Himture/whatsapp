"use client";

import { useState } from "react";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { useRequestHistory } from "@/hooks/use-request-history";
import type { RequestHistoryEntry } from "@/hooks/use-request-history";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function methodVariant(method: string): "default" | "success" | "warning" | "danger" {
  switch (method.toUpperCase()) {
    case "GET":
      return "default";
    case "POST":
      return "success";
    case "DELETE":
      return "danger";
    default:
      return "warning";
  }
}

function statusVariant(status: number): "success" | "danger" {
  return status >= 200 && status < 400 ? "success" : "danger";
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function HistoryCard({ entry }: { entry: RequestHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="py-3">
        <button
          type="button"
          className="w-full text-left"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={methodVariant(entry.method)}>
                {entry.method.toUpperCase()}
              </Badge>
              <span className="text-sm text-near-black truncate">
                {entry.url}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge variant={statusVariant(entry.status)}>
                {entry.status}
              </Badge>
              <span className="text-xs text-warm-500">{entry.duration}ms</span>
              <span className="text-xs text-warm-300">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 border-t border-black/5 pt-3">
            <div>
              <p className="text-xs font-semibold text-warm-500 mb-1">Request Body</p>
              <pre className="overflow-auto rounded-[var(--radius-micro)] bg-warm-white p-3 text-xs text-near-black">
                <code>{JSON.stringify(entry.requestBody, null, 2) ?? "null"}</code>
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold text-warm-500 mb-1">Response Body</p>
              <pre className="overflow-auto rounded-[var(--radius-micro)] bg-warm-white p-3 text-xs text-near-black">
                <code>{JSON.stringify(entry.responseBody, null, 2) ?? "null"}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryContent() {
  const { history, clearHistory } = useRequestHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-[-0.25px] text-near-black">
            Request History
          </h1>
          <p className="text-base text-warm-500 mt-1">
            Recent API calls made through the app
          </p>
        </div>
        {history.length > 0 && (
          <Button variant="danger" size="sm" onClick={clearHistory}>
            Clear History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-warm-500">No API calls recorded yet.</p>
            <p className="text-sm text-warm-300 mt-1">
              Requests will appear here as you use the app.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => (
            <HistoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ConfigGuard>
      <HistoryContent />
    </ConfigGuard>
  );
}
