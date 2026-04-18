"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { Plus, GripVertical, Trash2, Power, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getFlowStore } from "@/lib/stores";
import type { AutoReplyRuleRecord, TriggerType, MatchMode, ResponseType } from "@/lib/stores";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { DeploymentRequiredNotice } from "@/components/whatsapp/deployment-required-notice";

const TRIGGER_OPTIONS = [
  { label: "Any message", value: "any" },
  { label: "Greeting (hi, hello, hey…)", value: "greeting" },
  { label: "First message ever", value: "first_message" },
  { label: "Keyword match", value: "keyword" },
];

const MATCH_OPTIONS = [
  { label: "Contains keyword", value: "contains" },
  { label: "Exactly matches", value: "exact" },
  { label: "Starts with keyword", value: "starts_with" },
];

const RESPONSE_OPTIONS = [
  { label: "Text reply", value: "text" },
  { label: "Template", value: "template" },
];

export default function FlowsPage() {
  return (
    <ConfigGuard>
      <FlowsContent />
    </ConfigGuard>
  );
}

function FlowsContent() {
  const { mode } = useSessionMode();
  const { activeConfigId } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [rules, setRules] = useState<AutoReplyRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [fName, setFName] = useState("");
  const [fTrigger, setFTrigger] = useState<TriggerType>("greeting");
  const [fKeywords, setFKeywords] = useState("");
  const [fMatch, setFMatch] = useState<MatchMode>("contains");
  const [fResponseType, setFResponseType] = useState<ResponseType>("text");
  const [fResponseText, setFResponseText] = useState("");
  const [fTemplateName, setFTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) return;
    const store = getFlowStore(storeMode);
    const data = await store.getRules(activeConfigId);
    setRules(data);
    setLoading(false);
  }, [mode, storeMode, activeConfigId]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfigId) return;
    setSaving(true);

    const responsePayload: Record<string, unknown> =
      fResponseType === "text"
        ? { type: "text", text: { body: fResponseText } }
        : { type: "template", template: { name: fTemplateName, language: { code: "en" } } };

    const store = getFlowStore(storeMode);
    const result = await store.createRule({
      configId: activeConfigId,
      name: fName,
      triggerType: fTrigger,
      keywords: fTrigger === "keyword" && fKeywords ? fKeywords.split(",").map((k) => k.trim()).filter(Boolean) : undefined,
      matchMode: fMatch,
      responseType: fResponseType,
      responsePayload,
      priority: rules.length,
    });

    setSaving(false);
    if (result.success) {
      setShowForm(false);
      setFName(""); setFKeywords(""); setFResponseText(""); setFTemplateName("");
      notify.success("Rule created");
      void load();
    } else {
      notify.error(result.error ?? "Failed");
    }
  }

  async function handleToggle(rule: AutoReplyRuleRecord) {
    const store = getFlowStore(storeMode);
    const result = await store.updateRule(rule.id, { enabled: !rule.enabled });
    if (result.success) void load();
    else notify.error(result.error ?? "Failed");
  }

  async function handleConfirmDelete() {
    if (!deleteId) return;
    const store = getFlowStore(storeMode);
    const result = await store.deleteRule(deleteId);
    if (result.success) { notify.success("Rule deleted"); void load(); }
    else notify.error(result.error ?? "Failed");
    setDeleteId(null);
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Auto-Replies</h1>
          <p className="mt-1 text-sm text-warm-500">{rules.filter((r) => r.enabled).length} active rules · evaluated in priority order</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-4" aria-hidden="true" /> New Rule
        </Button>
      </div>

      {mode === "local" && <DeploymentRequiredNotice feature="Auto-replies" />}

      <div className="mb-4 flex items-start gap-2 rounded-[var(--radius-micro)] bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
        <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>Rules fire when a message arrives via webhook. The first matching rule sends the reply. Drag to reorder (lower index = higher priority).</p>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">New Auto-Reply Rule</CardTitle>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input label="Rule name" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="Welcome message" required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dropdown label="Trigger" options={TRIGGER_OPTIONS} value={fTrigger} onChange={(v) => setFTrigger(v as TriggerType)} />
                {fTrigger === "keyword" && (
                  <Dropdown label="Match mode" options={MATCH_OPTIONS} value={fMatch} onChange={(v) => setFMatch(v as MatchMode)} />
                )}
              </div>
              {fTrigger === "keyword" && (
                <Input label="Keywords (comma-separated)" value={fKeywords} onChange={(e) => setFKeywords(e.target.value)} placeholder="help, support, pricing" required description="The rule fires if any keyword matches." />
              )}
              <Dropdown label="Response type" options={RESPONSE_OPTIONS} value={fResponseType} onChange={(v) => setFResponseType(v as ResponseType)} />
              {fResponseType === "text" ? (
                <div>
                  <label htmlFor="reply-text" className="block text-sm font-medium text-near-black mb-1">Reply text <span className="text-danger">*</span></label>
                  <textarea
                    id="reply-text"
                    value={fResponseText}
                    onChange={(e) => setFResponseText(e.target.value)}
                    placeholder="Hi! Thanks for reaching out. We'll get back to you shortly."
                    rows={3}
                    required
                    className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
                  />
                </div>
              ) : (
                <Input label="Template name" value={fTemplateName} onChange={(e) => setFTemplateName(e.target.value)} placeholder="welcome_message" required description="Must be an approved template." />
              )}
              <div className="flex gap-2">
                <Button type="submit" loading={saving}>Create Rule</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {rules.length === 0 ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center">
            <Zap className="size-8 text-warm-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-warm-500">No rules yet. Create one to start auto-replying to incoming messages.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule, i) => (
            <Card key={rule.id} className={rule.enabled ? "" : "opacity-60"}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="size-4 text-warm-500 shrink-0 cursor-grab" aria-hidden="true" />
                  <div className="size-6 rounded-full bg-warm-100 flex items-center justify-center text-xs font-medium text-warm-600 shrink-0" aria-hidden="true">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-near-black">{rule.name}</span>
                      <Badge variant={rule.enabled ? "success" : "default"}>{rule.enabled ? "Active" : "Disabled"}</Badge>
                      <span className="text-xs text-warm-500 bg-warm-100 rounded px-1.5 py-0.5">{rule.triggerType}</span>
                      {rule.keywords && (
                        <span className="text-xs text-warm-500">{rule.keywords.join(", ")}</span>
                      )}
                    </div>
                    <p className="text-xs text-warm-500 mt-0.5 truncate">
                      Replies with: {rule.responseType === "text"
                        ? (rule.responsePayload as { text?: { body?: string } }).text?.body?.slice(0, 60)
                        : `template: ${(rule.responsePayload as { template?: { name?: string } }).template?.name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggle(rule)}
                      aria-label={rule.enabled ? `Disable rule ${rule.name}` : `Enable rule ${rule.name}`}
                      aria-pressed={rule.enabled}
                      className={`p-1.5 rounded transition-colors ${rule.enabled ? "text-green-600 hover:text-warm-500" : "text-warm-500 hover:text-green-600"}`}
                    >
                      <Power className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(rule.id)}
                      aria-label={`Delete rule ${rule.name}`}
                      className="p-1.5 rounded text-warm-500 hover:text-danger transition-colors"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete this auto-reply rule?"
        description="The rule stops responding to incoming messages immediately. Removed rules cannot be restored."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
