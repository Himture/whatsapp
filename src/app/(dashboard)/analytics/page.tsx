"use client";

import { useState, useCallback, useEffect, useMemo, startTransition } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, MessageSquare, Users, CheckCheck, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getInboxStore, getBroadcastStore } from "@/lib/stores";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { INDUSTRY_BENCHMARKS } from "@/lib/constants";

// Recharts is ~300KB. Load it only after the page shell has hydrated so it
// doesn't block the initial paint. ssr:false because recharts uses DOM APIs.
const DailyVolumeChart = dynamic(
  () => import("@/components/whatsapp/analytics-charts").then((m) => m.DailyVolumeChart),
  { ssr: false, loading: () => <div className="h-[240px] animate-pulse bg-warm-100 rounded-[var(--radius-subtle)]" /> },
);
const BroadcastPerformanceChart = dynamic(
  () => import("@/components/whatsapp/analytics-charts").then((m) => m.BroadcastPerformanceChart),
  { ssr: false, loading: () => <div className="h-[200px] animate-pulse bg-warm-100 rounded-[var(--radius-subtle)]" /> },
);

interface DailyStat { date: string; sent: number; delivered: number; read: number; received: number }
interface BroadcastStat { name: string; sent: number; delivered: number; readCount: number; failed: number }

export default function AnalyticsPage() {
  return (
    <ConfigGuard>
      <AnalyticsContent />
    </ConfigGuard>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; color: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-2xl font-bold text-near-black">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {sub ? <p className="text-xs text-warm-500 mt-0.5">{sub}</p> : null}
          </div>
          <div className={`size-9 rounded-[var(--radius-micro)] flex items-center justify-center ${color}`}>
            <Icon className="size-4 text-white" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnalyticsContent() {
  const { mode } = useSessionMode();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;
  const { activeConfigId } = useWhatsAppConfig();

  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<BroadcastStat[]>([]);
  const [loading, setLoading] = useState(true);

  // load only depends on the data source, not on history — sending a new
  // message elsewhere shouldn't re-run the entire IDB scan here.
  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) return;

    const inboxStore = getInboxStore(storeMode);
    const broadcastStore = getBroadcastStore(storeMode);

    const [broadcasts, events] = await Promise.all([
      broadcastStore.getBroadcasts(),
      inboxStore.getWebhookEvents(activeConfigId, 1000),
    ]);

    const statsByDay = new Map<string, DailyStat>();
    const getDay = (ts: string) => new Date(ts).toLocaleDateString("en-CA");

    for (const event of events) {
      if (event.eventType !== "messages") continue;
      const payload = event.payload as {
        statuses?: Array<{ status: string; timestamp: string }>;
        messages?: unknown[];
      };
      const day = getDay(event.createdAt);
      const stat = statsByDay.get(day) ?? { date: day, sent: 0, delivered: 0, read: 0, received: 0 };

      for (const s of payload.statuses ?? []) {
        if (s.status === "sent") stat.sent++;
        else if (s.status === "delivered") stat.delivered++;
        else if (s.status === "read") stat.read++;
      }
      stat.received += (payload.messages ?? []).length;

      statsByDay.set(day, stat);
    }

    const daily = Array.from(statsByDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([, v]) => v);

    const bStats: BroadcastStat[] = [];
    for (const b of broadcasts) {
      if (b.status !== "completed" && b.sentCount === 0) continue;
      if (bStats.length >= 10) break;
      bStats.push({
        name: b.name.slice(0, 20),
        sent: b.sentCount,
        delivered: b.deliveredCount,
        readCount: b.readCount,
        failed: b.failedCount,
      });
    }

    setDailyStats(daily);
    setBroadcastStats(bStats);
    setLoading(false);
  }, [mode, activeConfigId, storeMode]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  // Delivery stats come solely from webhook status events — the single source of
  // truth. We intentionally do NOT add outbound explorer calls here; doing so
  // double-counted against the webhook 'sent' status.
  const totals = useMemo(() => {
    const totalSent = dailyStats.reduce((n, d) => n + d.sent, 0);
    const totalDelivered = dailyStats.reduce((n, d) => n + d.delivered, 0);
    const totalRead = dailyStats.reduce((n, d) => n + d.read, 0);
    const totalReceived = dailyStats.reduce((n, d) => n + d.received, 0);
    return {
      sent: totalSent,
      delivered: totalDelivered,
      read: totalRead,
      received: totalReceived,
      deliveryRate: totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0,
      readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
    };
  }, [dailyStats]);

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">Analytics</h1>
        <p className="mt-1 text-sm text-warm-500">Last 30 days · delivery stats from webhook events</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Messages Sent" value={totals.sent} icon={MessageSquare} color="bg-notion-blue" />
        <StatCard
          label="Delivered"
          value={totals.delivered}
          sub={`${totals.deliveryRate}% · benchmark ${INDUSTRY_BENCHMARKS.deliveryRate}%`}
          icon={CheckCheck}
          color="bg-green-500"
        />
        <StatCard
          label="Read"
          value={totals.read}
          sub={`${totals.readRate}% · benchmark ${INDUSTRY_BENCHMARKS.readRate}%`}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard label="Received" value={totals.received} icon={Users} color="bg-orange-500" />
      </div>

      <p className="text-xs text-warm-500 mb-6">
        Benchmarks from WhatsApp Business&apos; published industry averages. Rates below benchmark often indicate send-time issues, list quality, or template fatigue.
      </p>

      {dailyStats.length > 0 ? (
        <DailyVolumeChart data={dailyStats} />
      ) : (
        <Card className="mb-6 bg-warm-white border-none">
          <CardContent className="py-8 text-center">
            <BarChart3 className="size-8 text-warm-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-warm-500">No webhook data yet. Set up your webhook URL in Settings to start tracking delivery stats.</p>
          </CardContent>
        </Card>
      )}

      {broadcastStats.length > 0 ? <BroadcastPerformanceChart data={broadcastStats} /> : null}
    </div>
  );
}
