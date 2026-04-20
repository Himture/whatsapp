"use client";

import { useState, useCallback, useEffect, useRef, startTransition } from "react";
import { Plus, Clock, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getScheduleStore } from "@/lib/stores";
import { messagesApi } from "@/lib/whatsapp";
import type { ScheduledMessageRecord } from "@/lib/stores";
import type { ConfigRecord } from "@/lib/datastore";
import type { WhatsAppClientConfig } from "@/lib/types";
import type { ApiVersion } from "@/lib/constants";
import { ConfigGuard } from "@/components/whatsapp/config-guard";

function toClientConfig(c: ConfigRecord): WhatsAppClientConfig {
  return {
    accessToken: c.accessToken,
    phoneNumberId: c.phoneNumberId,
    wabaId: c.wabaId,
    businessPortfolioId: c.businessPortfolioId ?? undefined,
    version: c.apiVersion as ApiVersion,
  };
}

// datetime-local renders in the user's local time, so build `min` in local time
// too (not UTC) — otherwise in offset timezones a valid future time gets rejected
// or a past one slips through.
function localNowForInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="size-3.5 text-warm-500" aria-hidden="true" />,
  sent: <CheckCircle className="size-3.5 text-green-600" aria-hidden="true" />,
  failed: <XCircle className="size-3.5 text-danger" aria-hidden="true" />,
  cancelled: <XCircle className="size-3.5 text-warm-500" aria-hidden="true" />,
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  pending: "default",
  sent: "success",
  failed: "danger",
  cancelled: "default",
};

export default function SchedulePage() {
  return (
    <ConfigGuard>
      <ScheduleContent />
    </ConfigGuard>
  );
}

function ScheduleContent() {
  const { mode } = useSessionMode();
  const { activeConfigId, configs } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [messages, setMessages] = useState<ScheduledMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Latest configs read through a ref so the poll interval doesn't restart every
  // render; processingRef stops overlapping 30s ticks within this tab.
  const configsRef = useRef(configs);
  const processingRef = useRef(false);

  useEffect(() => {
    configsRef.current = configs;
  }, [configs]);

  const [fname, setFname] = useState("");
  const [fto, setFto] = useState("");
  const [fbody, setFbody] = useState("");
  const [fschedule, setFschedule] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) return;
    const store = getScheduleStore(storeMode);
    const data = await store.getScheduledMessages();
    setMessages(data.filter((m) => m.configId === activeConfigId));
    setLoading(false);
  }, [mode, storeMode, activeConfigId]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  // Local-mode polling: every 30s, dispatch any due messages. Each message is sent
  // through ITS OWN config's credentials (not whatever config happens to be active),
  // and guarded so overlapping ticks and other open tabs can't double-send.
  useEffect(() => {
    if (mode !== "local" || !activeConfigId) return;

    async function sendScheduled(msg: ScheduledMessageRecord, cfg: WhatsAppClientConfig) {
      const store = getScheduleStore("local");
      const run = async () => {
        // Re-read under the lock — another tab may have just sent this one.
        const current = (await store.getScheduledMessages()).find((m) => m.id === msg.id);
        if (!current || current.status !== "pending") return;
        const payload = msg.payload as { to?: string; text?: { body?: string } };
        const result = await messagesApi.sendText(cfg, payload.to ?? "", payload.text?.body ?? "");
        if (result.ok) {
          const wamid = (result.data as { messages?: Array<{ id: string }> })?.messages?.[0]?.id;
          await store.updateScheduledMessage(msg.id, {
            status: "sent",
            waMessageId: wamid,
            processedAt: new Date().toISOString(),
          });
        } else {
          await store.updateScheduledMessage(msg.id, {
            status: "failed",
            error: (result.data as { error?: { message?: string } })?.error?.message ?? "Send failed",
            processedAt: new Date().toISOString(),
          });
        }
      };
      // navigator.locks is a cross-tab mutex per message; ifAvailable means we skip
      // (don't block) when another tab already holds it.
      if (typeof navigator !== "undefined" && navigator.locks) {
        await navigator.locks.request(`schedule:${msg.id}`, { ifAvailable: true }, async (lock) => {
          if (lock) await run();
        });
      } else {
        await run();
      }
    }

    async function processDue() {
      if (processingRef.current) return;
      processingRef.current = true;
      try {
        const store = getScheduleStore("local");
        const due = await store.getPendingDue();
        if (due.length === 0) return;
        const byId = new Map(configsRef.current.map((c) => [c.id, c]));
        for (const msg of due) {
          const cfg = byId.get(msg.configId);
          if (cfg) await sendScheduled(msg, toClientConfig(cfg));
        }
        void load();
      } finally {
        processingRef.current = false;
      }
    }

    timerRef.current = setInterval(() => { void processDue(); }, 30_000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, activeConfigId, load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfigId) return;
    setSaving(true);
    const store = getScheduleStore(storeMode);
    const result = await store.createScheduledMessage({
      configId: activeConfigId,
      name: fname || undefined,
      payload: { to: fto, text: { body: fbody } },
      scheduledAt: new Date(fschedule).toISOString(),
    });
    setSaving(false);
    if (result.success) {
      setShowForm(false);
      setFname(""); setFto(""); setFbody(""); setFschedule("");
      notify.success("Message scheduled");
      void load();
    } else {
      notify.error(result.error ?? "Failed");
    }
  }

  async function handleConfirmCancel() {
    if (!cancelId) return;
    const store = getScheduleStore(storeMode);
    const result = await store.cancelScheduledMessage(cancelId);
    if (result.success) { notify.success("Cancelled"); void load(); }
    else notify.error(result.error ?? "Failed");
    setCancelId(null);
  }

  const pending: typeof messages = [];
  const past: typeof messages = [];
  for (const m of messages) {
    if (m.status === "pending") pending.push(m);
    else past.push(m);
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Scheduled Messages</h1>
          <p className="mt-1 text-sm text-warm-500">{pending.length} pending</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" aria-hidden="true" /> Schedule Message
        </Button>
      </div>

      {mode === "local" && pending.length > 0 && (
        <div className="mb-4 flex gap-2 rounded-[var(--radius-micro)] bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
          <p>Local mode: this tab must stay open for scheduled messages to send. For reliable delivery, deploy with a database.</p>
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">New Scheduled Message</CardTitle>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Name (optional)" value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Monthly update" />
                <Input label="To (phone E.164)" value={fto} onChange={(e) => setFto(e.target.value)} placeholder="+15551234567" required />
              </div>
              <div>
                <label htmlFor="schedule-body" className="block text-sm font-medium text-near-black mb-1">Message body <span className="text-danger">*</span></label>
                <textarea
                  id="schedule-body"
                  value={fbody}
                  onChange={(e) => setFbody(e.target.value)}
                  placeholder="Your scheduled message text…"
                  rows={3}
                  required
                  className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
                />
              </div>
              <Input
                label="Send at"
                type="datetime-local"
                value={fschedule}
                onChange={(e) => setFschedule(e.target.value)}
                required
                min={localNowForInput()}
              />
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>Schedule</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pending.length === 0 && past.length === 0 ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center">
            <Clock className="size-8 text-warm-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-warm-500">No scheduled messages. Schedule one above.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">Upcoming</h2>
              <div className="flex flex-col gap-2">
                {pending.map((msg) => (
                  <Card key={msg.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {STATUS_ICON[msg.status]}
                            <span className="font-medium text-sm text-near-black">{msg.name ?? "Scheduled message"}</span>
                            <Badge variant={STATUS_VARIANT[msg.status] ?? "default"}>{msg.status}</Badge>
                          </div>
                          <p className="text-xs text-warm-500 mt-0.5 truncate">
                            To: {(msg.payload as { to?: string }).to} · {new Date(msg.scheduledAt).toLocaleString()}
                          </p>
                          <p className="text-xs text-warm-500 mt-0.5 truncate">
                            {(msg.payload as { text?: { body?: string } }).text?.body}
                          </p>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setCancelId(msg.id)} className="shrink-0">
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2">Past</h2>
              <div className="flex flex-col gap-2">
                {past.slice(0, 20).map((msg) => (
                  <Card key={msg.id} className="opacity-75">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {STATUS_ICON[msg.status]}
                        <span className="text-sm text-near-black">{msg.name ?? "Scheduled message"}</span>
                        <Badge variant={STATUS_VARIANT[msg.status] ?? "default"}>{msg.status}</Badge>
                        <span className="text-xs text-warm-500 ml-auto">{new Date(msg.scheduledAt).toLocaleString()}</span>
                      </div>
                      {msg.error && <p className="text-xs text-danger mt-1 ml-6">{msg.error}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex items-start gap-1.5 text-xs text-warm-500">
        <Info className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Text messages only for now. Template scheduling and advanced recurrence coming soon.</p>
      </div>

      <ConfirmDialog
        open={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleConfirmCancel}
        title="Cancel this scheduled message?"
        description="The message will not be sent. You can schedule a new one anytime."
        confirmLabel="Cancel send"
        cancelLabel="Keep scheduled"
        destructive
      />
    </div>
  );
}
