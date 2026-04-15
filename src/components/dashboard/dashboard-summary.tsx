"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { Inbox, CalendarClock, Megaphone, Webhook, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getInboxStore, getBroadcastStore, getScheduleStore } from "@/lib/stores";
import { ROUTES } from "@/lib/constants";

interface Summary {
  unread: number;
  scheduledToday: number;
  activeBroadcasts: number;
  lastWebhookAt: string | null;
}

const initialSummary: Summary = { unread: 0, scheduledToday: 0, activeBroadcasts: 0, lastWebhookAt: null };

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

export function DashboardSummary() {
  const { mode } = useSessionMode();
  const { activeConfigId } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) {
      setLoading(false);
      return;
    }
    const inboxStore = getInboxStore(storeMode);
    const broadcastStore = getBroadcastStore(storeMode);
    const scheduleStore = getScheduleStore(storeMode);

    const [conversations, broadcasts, scheduled, recentEvents] = await Promise.all([
      inboxStore.getConversations(activeConfigId),
      broadcastStore.getBroadcasts(),
      scheduleStore.getScheduledMessages(),
      inboxStore.getWebhookEvents(activeConfigId, 1),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    setSummary({
      unread: conversations.reduce((n, c) => n + c.unreadCount, 0),
      scheduledToday: scheduled.filter((s) => {
        const at = new Date(s.scheduledAt);
        return s.status === "pending" && at >= todayStart && at < todayEnd;
      }).length,
      activeBroadcasts: broadcasts.filter((b) => b.status === "running" || b.status === "paused").length,
      lastWebhookAt: recentEvents[0]?.createdAt ?? null,
    });
    setLoading(false);
  }, [mode, storeMode, activeConfigId]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Spinner size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (!activeConfigId) return null;

  const tiles: Array<{ label: string; value: string; href: string; icon: React.ElementType; color: string }> = [
    { label: "Unread messages", value: summary.unread.toLocaleString(), href: ROUTES.INBOX, icon: Inbox, color: "bg-notion-blue" },
    { label: "Scheduled today", value: summary.scheduledToday.toLocaleString(), href: ROUTES.SCHEDULE, icon: CalendarClock, color: "bg-purple-500" },
    { label: "Active broadcasts", value: summary.activeBroadcasts.toLocaleString(), href: ROUTES.BROADCASTS, icon: Megaphone, color: "bg-orange-500" },
    { label: "Last webhook", value: formatRelative(summary.lastWebhookAt), href: ROUTES.WEBHOOKS, icon: Webhook, color: "bg-green-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(({ label, value, href, icon: Icon, color }) => (
        <Link key={label} href={href} className="block group">
          <Card className="h-full transition-shadow group-hover:shadow-deep">
            <CardContent className="py-4">
              <div className="flex items-start justify-between mb-2">
                <span className={`size-8 rounded-[var(--radius-micro)] flex items-center justify-center ${color}`}>
                  <Icon className="size-4 text-white" aria-hidden="true" />
                </span>
                <ArrowRight className="size-3 text-warm-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
              <p className="text-xs text-warm-500 uppercase tracking-wide">{label}</p>
              <p className="mt-0.5 text-xl font-bold text-near-black">{value}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
