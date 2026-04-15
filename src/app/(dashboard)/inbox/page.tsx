"use client";

import { useState, useCallback, useEffect, startTransition, useMemo, useDeferredValue } from "react";
import { Search, MessageSquare, Info } from "lucide-react";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getInboxStore } from "@/lib/stores";
import type { ConversationSummary } from "@/lib/stores";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function InboxPage() {
  return (
    <ConfigGuard>
      <InboxContent />
    </ConfigGuard>
  );
}

function InboxContent() {
  const { mode } = useSessionMode();
  const { activeConfigId } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) return;
    const store = getInboxStore(storeMode);
    const data = await store.getConversations(activeConfigId);
    setConversations(data);
    setLoading(false);
  }, [mode, storeMode, activeConfigId]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  const totalUnread = useMemo(
    () => conversations.reduce((n, c) => n + c.unreadCount, 0),
    [conversations],
  );

  const filtered = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (c) => c.phone.includes(deferredSearch) || (c.name ?? "").toLowerCase().includes(term),
    );
  }, [conversations, deferredSearch]);

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  function previewText(conv: ConversationSummary): string {
    const msg = conv.lastMessage;
    if (msg.messageType === "text") return (msg.content as { body?: string }).body ?? "";
    return `[${msg.messageType}]`;
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Inbox</h1>
          <p className="mt-1 text-sm text-warm-500">
            {conversations.length} conversations · {totalUnread} unread
          </p>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="mb-4 flex gap-2 rounded-[var(--radius-micro)] bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-medium">No messages yet</p>
            <p className="mt-0.5 text-blue-700">
              Point your WhatsApp webhook to{" "}
              <code className="bg-blue-100 px-1 rounded text-xs">
                <span suppressHydrationWarning>{typeof window !== "undefined" ? window.location.origin : ""}</span>/api/webhooks/{activeConfigId}
              </code>{" "}
              to receive messages here.{" "}
              <Link href={ROUTES.SETTINGS} className="underline hover:no-underline">View verify token in Settings →</Link>
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-warm-500" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone…"
          aria-label="Search conversations"
          className="w-full pl-9 pr-4 py-2 rounded-[var(--radius-micro)] border border-input-border bg-white text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center">
            <MessageSquare className="size-8 text-warm-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-warm-500">No conversations yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-[var(--radius-subtle)] border border-black/10 overflow-hidden bg-white">
          {filtered.map((conv, i) => (
            <Link
              key={conv.phone}
              href={`/inbox/${encodeURIComponent(conv.phone)}`}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-warm-white/60 transition-colors ${i < filtered.length - 1 ? "border-b border-black/5" : ""}`}
            >
              <div className="size-10 rounded-full bg-warm-100 flex items-center justify-center shrink-0 text-sm font-medium text-warm-600" aria-hidden="true">
                {(conv.name ?? conv.phone).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-near-black text-sm truncate">
                    {conv.name ?? conv.phone}
                  </span>
                  <span className="text-xs text-warm-500 shrink-0 ml-2">
                    {formatTime(conv.lastMessage.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-warm-500 truncate">{previewText(conv)}</p>
                  {conv.unreadCount > 0 && (
                    <Badge variant="default" className="ml-2 shrink-0 bg-notion-blue text-white text-[10px] px-1.5 py-0.5">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
