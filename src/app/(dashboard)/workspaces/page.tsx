"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Inbox, Megaphone, Plus, Radio, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingPage } from "@/components/ui/loading";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getInboxStore, getBroadcastStore } from "@/lib/stores";
import { ROUTES } from "@/lib/constants";
import type { ConfigRecord } from "@/lib/datastore";

interface WorkspaceStats {
  unreadCount: number;
  runningBroadcasts: number;
  messagesLast7d: number;
  lastActivity: string | null;
}

const SAFE_COLOR_REGEX = /^#[0-9a-fA-F]{3,8}$/;
function safeColor(input: string | null): string {
  if (input && SAFE_COLOR_REGEX.test(input)) return input;
  return "var(--color-notion-blue)";
}

async function computeStats(configId: string, storeMode: "local" | "remote"): Promise<WorkspaceStats> {
  const inboxStore = getInboxStore(storeMode);
  const broadcastStore = getBroadcastStore(storeMode);

  const [conversations, broadcasts, events] = await Promise.all([
    inboxStore.getConversations(configId),
    broadcastStore.getBroadcasts(),
    inboxStore.getWebhookEvents(configId, 500),
  ]);

  const unreadCount = conversations.reduce((n, c) => n + c.unreadCount, 0);
  const runningBroadcasts = broadcasts.filter((b) => b.configId === configId && b.status === "running").length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  let messagesLast7d = 0;
  let lastActivity: string | null = null;
  for (const event of events) {
    const ts = new Date(event.createdAt).getTime();
    if (!lastActivity || new Date(event.createdAt) > new Date(lastActivity)) {
      lastActivity = event.createdAt;
    }
    if (ts >= sevenDaysAgo && event.eventType === "messages") {
      const payload = event.payload as { messages?: unknown[]; statuses?: unknown[] };
      messagesLast7d += (payload.messages ?? []).length + (payload.statuses ?? []).length;
    }
  }
  return { unreadCount, runningBroadcasts, messagesLast7d, lastActivity };
}

function WorkspaceCard({ config, stats, onEnter }: {
  config: ConfigRecord;
  stats: WorkspaceStats | null;
  onEnter: () => void;
}) {
  const displayName = config.displayName ?? config.name;
  const accentColor = safeColor(config.brandColor);
  const ariaLabel = `Open ${displayName}${stats ? `, ${stats.unreadCount} unread, ${stats.runningBroadcasts} running broadcasts` : ""}`;

  return (
    <button
      type="button"
      onClick={onEnter}
      aria-label={ariaLabel}
      className="group text-left rounded-[var(--radius-comfortable)] border border-black/10 bg-white p-5 hover:border-notion-blue hover:shadow-card transition-all flex flex-col gap-3 focus-visible:ring-2 focus-visible:ring-focus-blue"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          <p className="font-semibold text-near-black truncate">{displayName}</p>
        </div>
        {config.isDefault ? <Badge variant="default">Default</Badge> : null}
      </div>

      <p className="text-xs font-mono text-warm-500 truncate">{config.phoneNumberId}</p>

      <div className="grid grid-cols-3 gap-2 mt-auto">
        <div className="rounded-[var(--radius-micro)] bg-warm-white p-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-warm-500">
            <Inbox className="size-3" aria-hidden="true" /> Unread
          </div>
          <p className="mt-1 text-lg font-bold text-near-black">{stats?.unreadCount ?? "—"}</p>
        </div>
        <div className="rounded-[var(--radius-micro)] bg-warm-white p-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-warm-500">
            <Megaphone className="size-3" aria-hidden="true" /> Live
          </div>
          <p className="mt-1 text-lg font-bold text-near-black">{stats?.runningBroadcasts ?? "—"}</p>
        </div>
        <div className="rounded-[var(--radius-micro)] bg-warm-white p-2">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-warm-500">
            <Radio className="size-3" aria-hidden="true" /> 7d
          </div>
          <p className="mt-1 text-lg font-bold text-near-black">{stats?.messagesLast7d ?? "—"}</p>
        </div>
      </div>

      <p className="text-xs text-notion-blue font-medium inline-flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100 transition-opacity">
        Open workspace <ArrowRight className="size-3" aria-hidden="true" />
      </p>
    </button>
  );
}

const GHOST_PREVIEWS = [
  { color: "#3b82f6", name: "Acme Retail" },
  { color: "#a855f7", name: "Studio 42" },
  { color: "#f97316", name: "Lotus Catering" },
];

function EmptyWorkspaces() {
  return (
    <div className="rounded-[var(--radius-comfortable)] border border-dashed border-black/15 bg-warm-white p-6">
      <div className="text-center mb-5">
        <Briefcase className="size-8 text-warm-500 mx-auto mb-2" aria-hidden="true" />
        <h2 className="text-base font-semibold text-near-black">Run every WhatsApp number from one dashboard</h2>
        <p className="mt-1 text-sm text-warm-500 max-w-md mx-auto">
          Each workspace keeps its own credentials, unread counter, brand colour and display name — so every number stays cleanly separated.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5" aria-hidden="true">
        {GHOST_PREVIEWS.map((p) => (
          <div key={p.name} className="rounded-[var(--radius-comfortable)] border border-black/10 bg-white p-4 opacity-50">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
              <p className="font-semibold text-sm text-near-black truncate">{p.name}</p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-[var(--radius-micro)] bg-warm-white py-3" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Link href={ROUTES.SETTINGS}>
          <Button size="sm"><Plus className="size-4" aria-hidden="true" /> Create your first workspace</Button>
        </Link>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { mode } = useSessionMode();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;
  const { configs, loading, setActiveConfigId } = useWhatsAppConfig();
  const [stats, setStats] = useState<Record<string, WorkspaceStats>>({});

  const loadStats = useCallback(async () => {
    if (mode === "loading" || configs.length === 0) return;
    const entries = await Promise.all(
      configs.map(async (c) => [c.id, await computeStats(c.id, storeMode)] as const),
    );
    setStats(Object.fromEntries(entries));
  }, [mode, configs, storeMode]);

  useEffect(() => {
    startTransition(() => { void loadStats(); });
  }, [loadStats]);

  function handleEnter(configId: string) {
    setActiveConfigId(configId);
    router.push(ROUTES.DASHBOARD);
  }

  if (loading) return <LoadingPage />;

  const aggregates = Object.values(stats).reduce(
    (acc, s) => ({
      unread: acc.unread + s.unreadCount,
      running: acc.running + s.runningBroadcasts,
      messages: acc.messages + s.messagesLast7d,
    }),
    { unread: 0, running: 0, messages: 0 },
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Workspaces</h1>
          <p className="mt-1 text-sm text-warm-500">
            {configs.length} {configs.length === 1 ? "workspace" : "workspaces"} · click any card to enter
          </p>
        </div>
        <Link href={ROUTES.SETTINGS}>
          <Button size="sm"><Plus className="size-4" aria-hidden="true" /> New Workspace</Button>
        </Link>
      </div>

      {configs.length > 1 ? (
        <Card className="mb-6 bg-warm-white border-none">
          <CardContent className="py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-warm-500 mb-2">
              Across all workspaces
            </p>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-near-black">{aggregates.unread}</p>
                <p className="text-xs text-warm-500">Unread messages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-near-black">{aggregates.running}</p>
                <p className="text-xs text-warm-500">Running broadcasts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-near-black">{aggregates.messages}</p>
                <p className="text-xs text-warm-500">Events last 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {configs.length === 0 ? (
        <EmptyWorkspaces />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configs.map((config) => (
            <WorkspaceCard
              key={config.id}
              config={config}
              stats={stats[config.id] ?? null}
              onEnter={() => handleEnter(config.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-8 text-xs text-warm-500">
        Tip: give each workspace its own display name and brand colour in Settings to tell your numbers apart at a glance.
      </div>
    </div>
  );
}
