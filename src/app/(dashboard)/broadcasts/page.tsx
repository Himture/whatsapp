"use client";

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import { Plus, Play, Pause, RotateCcw, Trash2, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BroadcastSafetyCheck } from "@/components/whatsapp/broadcast-safety-check";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getBroadcastStore } from "@/lib/stores";
import { messagesApi } from "@/lib/whatsapp";
import { META_TIER_LIMITS, ROUTES, BROADCAST_SAFETY_CHECK_THRESHOLD } from "@/lib/constants";
import type { BroadcastRecord, BroadcastRecipientRecord } from "@/lib/stores";
import Link from "next/link";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  completed: "success",
  running: "default",
  paused: "warning",
  failed: "danger",
  draft: "default",
};

export default function BroadcastsPage() {
  const { mode } = useSessionMode();
  const { activeConfig } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [recipientsByBroadcast, setRecipientsByBroadcast] = useState<Record<string, BroadcastRecipientRecord[]>>({});
  const [runningId, setRunningId] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    broadcast: BroadcastRecord;
    recipients: BroadcastRecipientRecord[];
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const runningRef = useRef<{ broadcastId: string; cancel: boolean } | null>(null);

  const load = useCallback(async () => {
    if (mode === "loading") return;
    const store = getBroadcastStore(storeMode);
    const data = await store.getBroadcasts();
    setBroadcasts(data);
    setLoading(false);
  }, [mode, storeMode]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  async function handleExpand(broadcastId: string) {
    if (expanded === broadcastId) { setExpanded(null); return; }
    setExpanded(broadcastId);
    const store = getBroadcastStore(storeMode);
    const data = await store.getRecipients(broadcastId);
    setRecipientsByBroadcast((prev) => ({ ...prev, [broadcastId]: data }));
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    if (runningRef.current?.broadcastId === deleteId) {
      notify.error("Pause the broadcast before deleting");
      setDeleteId(null);
      return;
    }
    const store = getBroadcastStore(storeMode);
    const result = await store.deleteBroadcast(deleteId);
    if (result.success) { notify.success("Broadcast deleted"); void load(); }
    else notify.error(result.error ?? "Failed");
    setDeleteId(null);
  }

  async function handleRun(broadcast: BroadcastRecord) {
    if (!activeConfig) { notify.error("No active config selected"); return; }

    const store = getBroadcastStore(storeMode);
    const recipientList = await store.getRecipients(broadcast.id);
    const pending = recipientList.filter((r) => r.status === "pending" || r.status === "failed");

    if (pending.length === 0) { notify.error("No pending recipients"); return; }

    if (pending.length >= BROADCAST_SAFETY_CHECK_THRESHOLD) {
      setPendingConfirmation({ broadcast, recipients: pending });
      return;
    }

    await executeRun(broadcast, pending);
  }

  async function executeRun(broadcast: BroadcastRecord, pending: BroadcastRecipientRecord[]) {
    if (!activeConfig) return;
    const store = getBroadcastStore(storeMode);

    runningRef.current = { broadcastId: broadcast.id, cancel: false };
    setRunningId(broadcast.id);
    await store.updateBroadcastStatus(broadcast.id, "running");
    void load();

    let sent = broadcast.sentCount;
    let failed = broadcast.failedCount;

    for (const recipient of pending) {
      if (runningRef.current?.cancel) break;

      const broadcastPayload = broadcast.payload as {
        type?: string;
        text?: { body?: string };
        template?: { name?: string; language?: { code?: string }; components?: unknown[] };
      };

      const result = broadcastPayload.type === "template" && broadcastPayload.template?.name
        ? await messagesApi.sendTemplate(
            activeConfig,
            recipient.phone,
            broadcastPayload.template.name,
            broadcastPayload.template.language?.code ?? "en",
            (broadcastPayload.template.components ?? []) as Record<string, unknown>[],
          )
        : await messagesApi.sendText(
            activeConfig,
            recipient.phone,
            broadcastPayload.text?.body ?? "",
          );

      if (result.ok) {
        sent++;
        const wamid = (result.data as { messages?: Array<{ id: string }> })?.messages?.[0]?.id;
        await store.updateRecipientStatus(recipient.id, "sent", wamid);
        await store.updateBroadcastStatus(broadcast.id, "running", { sentCount: sent });
      } else {
        failed++;
        const errMsg = (result.data as { error?: { message?: string } })?.error?.message ?? "Send failed";
        await store.updateRecipientStatus(recipient.id, "failed", undefined, errMsg);
        await store.updateBroadcastStatus(broadcast.id, "running", { failedCount: failed });
      }

      void load();
      await new Promise((res) => setTimeout(res, broadcast.rateLimitMs));
    }

    const finalStatus = runningRef.current?.cancel ? "paused" : "completed";
    await store.updateBroadcastStatus(broadcast.id, finalStatus, { sentCount: sent, failedCount: failed });
    runningRef.current = null;
    setRunningId(null);
    void load();
    if (finalStatus === "completed") {
      notify.success(`Broadcast complete. ${sent} sent, ${failed} failed.`);
    } else {
      notify.info("Broadcast paused.");
    }
  }

  function handlePause() {
    if (runningRef.current) runningRef.current.cancel = true;
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-4xl mx-auto">
      <BroadcastSafetyCheck
        open={pendingConfirmation !== null}
        recipients={pendingConfirmation?.recipients.map((r) => ({ phone: r.phone, name: r.name })) ?? []}
        messageType={pendingConfirmation?.broadcast.messageType ?? "text"}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={async () => {
          if (!pendingConfirmation) return;
          const { broadcast, recipients } = pendingConfirmation;
          setPendingConfirmation(null);
          await executeRun(broadcast, recipients);
        }}
      />

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Broadcasts</h1>
          <p className="mt-1 text-sm text-warm-500">Send messages to multiple contacts with rate limiting</p>
        </div>
        <Link href={ROUTES.BROADCASTS + "/new"}>
          <Button size="sm"><Plus className="size-4" /> New Broadcast</Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {META_TIER_LIMITS.slice(0, 3).map((tier) => (
          <div key={tier.tier} className="text-xs bg-warm-100 rounded px-2 py-1 text-warm-500">
            <span className="font-medium text-near-black">{tier.label}</span>: {tier.dailyLimit.toLocaleString()} msg/day
          </div>
        ))}
        <div className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1 text-amber-900 flex items-center gap-1">
          <AlertTriangle className="size-3" aria-hidden="true" /> Limits reset daily at midnight UTC
        </div>
      </div>

      {broadcasts.length === 0 ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center text-sm text-warm-500">
            No broadcasts yet. Create one to send messages to multiple contacts at once.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {broadcasts.map((broadcast) => {
            const isRunning = runningId === broadcast.id;
            const progress = broadcast.totalRecipients > 0
              ? Math.round(((broadcast.sentCount + broadcast.failedCount) / broadcast.totalRecipients) * 100)
              : 0;
            const broadcastRecipients = recipientsByBroadcast[broadcast.id] ?? [];

            return (
              <Card key={broadcast.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-near-black">{broadcast.name}</span>
                      <Badge variant={STATUS_VARIANT[broadcast.status] ?? "default"}>
                        {isRunning ? "running" : broadcast.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {broadcast.status !== "completed" && !isRunning && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRun(broadcast)}
                          aria-label={`Start or resume broadcast ${broadcast.name}`}
                        >
                          <Play className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      {isRunning && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handlePause}
                          aria-label={`Pause broadcast ${broadcast.name}`}
                        >
                          <Pause className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      {broadcast.status === "completed" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleRun(broadcast)}
                          aria-label={`Retry failed recipients in ${broadcast.name}`}
                        >
                          <RotateCcw className="size-3.5" aria-hidden="true" />
                        </Button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExpand(broadcast.id)}
                        aria-label={expanded === broadcast.id ? `Collapse recipients for ${broadcast.name}` : `Expand recipients for ${broadcast.name}`}
                        aria-expanded={expanded === broadcast.id}
                        className="p-1.5 text-warm-500 hover:text-near-black rounded transition-colors"
                      >
                        {expanded === broadcast.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(broadcast.id)}
                        aria-label={`Delete broadcast ${broadcast.name}`}
                        className="p-1.5 text-warm-500 hover:text-danger rounded transition-colors"
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-warm-500 mb-2 flex-wrap">
                    <span className="text-green-700">{broadcast.sentCount} sent</span>
                    <span className="text-danger">{broadcast.failedCount} failed</span>
                    <span>{broadcast.totalRecipients - broadcast.sentCount - broadcast.failedCount} pending</span>
                    <span className="text-warm-500">{broadcast.rateLimitMs}ms/msg</span>
                  </div>
                  <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${broadcast.status === "failed" ? "bg-danger" : "bg-notion-blue"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {expanded === broadcast.id && (
                    <div className="mt-4 rounded border border-black/10 overflow-x-auto">
                      <table className="w-full text-xs min-w-[480px]">
                        <thead className="bg-warm-white">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-warm-500">Name</th>
                            <th className="px-3 py-2 text-left font-medium text-warm-500">Phone</th>
                            <th className="px-3 py-2 text-left font-medium text-warm-500">Status</th>
                            <th className="px-3 py-2 text-left font-medium text-warm-500 hidden sm:table-cell">Message ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {broadcastRecipients.map((r) => (
                            <tr key={r.id} className="bg-white hover:bg-warm-white/60">
                              <td className="px-3 py-2 text-near-black">{r.name ?? "—"}</td>
                              <td className="px-3 py-2 font-mono text-warm-500">{r.phone}</td>
                              <td className="px-3 py-2">
                                <Badge variant={r.status === "sent" || r.status === "delivered" || r.status === "read" ? "success" : r.status === "failed" ? "danger" : "default"}>
                                  {r.status}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 font-mono text-warm-500 hidden sm:table-cell truncate max-w-[120px]">{r.waMessageId ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete broadcast?"
        description="This permanently removes the broadcast and all per-recipient send history. The action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
