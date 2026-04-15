"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { Plus, RefreshCw, Trash2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dropdown } from "@/components/ui/dropdown";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingPage } from "@/components/ui/loading";
import { notify } from "@/hooks/use-toast";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { TemplateGallery } from "@/components/whatsapp/template-gallery";
import { templatesApi, type TemplateRecord, type TemplateComponent } from "@/lib/whatsapp";
import type { TemplatePreset } from "@/lib/template-presets";
import { TEMPLATE_CATEGORIES, TEMPLATE_LANGUAGES } from "@/lib/constants";

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "default"> = {
  APPROVED: "success",
  PENDING: "default",
  IN_APPEAL: "warning",
  REJECTED: "danger",
  PAUSED: "warning",
  DISABLED: "danger",
};

const CATEGORY_OPTIONS = TEMPLATE_CATEGORIES.map((c) => ({ label: c, value: c }));
const LANGUAGE_OPTIONS = TEMPLATE_LANGUAGES.map((l) => ({ label: l.label, value: l.code }));

interface TemplateButtonField {
  _key: string;
  type: string;
  text: string;
  url: string;
}

function makeButton(): TemplateButtonField {
  return { _key: crypto.randomUUID(), type: "QUICK_REPLY", text: "", url: "" };
}

export default function TemplatesPage() {
  return (
    <ConfigGuard>
      <TemplatesContent />
    </ConfigGuard>
  );
}

function TemplatesContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<TemplateRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateRecord | null>(null);

  const [tName, setTName] = useState("");
  const [tCategory, setTCategory] = useState<string>("MARKETING");
  const [tLanguage, setTLanguage] = useState<string>("en");
  const [tBody, setTBody] = useState("");
  const [tHeader, setTHeader] = useState("");
  const [tFooter, setTFooter] = useState("");
  const [tButtons, setTButtons] = useState<TemplateButtonField[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!activeConfig) return;
    const result = await templatesApi.list(activeConfig);
    if (result.ok && "data" in result.data) {
      setTemplates((result.data as { data: TemplateRecord[] }).data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [activeConfig]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  function handleRefresh() {
    setRefreshing(true);
    void load();
  }

  function applyPreset(preset: TemplatePreset) {
    setTName(preset.input.name);
    setTCategory(preset.input.category);
    setTLanguage(preset.input.language);
    const findText = (type: "HEADER" | "BODY" | "FOOTER") =>
      preset.input.components.find((c) => c.type === type)?.text ?? "";
    setTHeader(findText("HEADER"));
    setTBody(findText("BODY"));
    setTFooter(findText("FOOTER"));
    setTButtons([]);
    setShowForm(true);
  }

  async function handleConfirmDelete() {
    if (!activeConfig || !deleteTarget) return;
    const result = await templatesApi.deleteByName(activeConfig, deleteTarget.name, deleteTarget.language);
    if (result.ok) { notify.success("Template deleted"); void load(); }
    else notify.error("Failed to delete template");
    setDeleteTarget(null);
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setSaving(true);

    const components: TemplateComponent[] = [];
    if (tHeader) components.push({ type: "HEADER", format: "TEXT", text: tHeader });
    if (tBody) components.push({ type: "BODY", text: tBody });
    if (tFooter) components.push({ type: "FOOTER", text: tFooter });
    if (tButtons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: tButtons.map((b) => ({
          type: b.type as "QUICK_REPLY" | "URL",
          text: b.text,
          ...(b.type === "URL" && b.url ? { url: b.url } : {}),
        })),
      });
    }

    const result = await templatesApi.create(activeConfig, {
      name: tName.toLowerCase().replace(/\s+/g, "_"),
      language: tLanguage,
      category: tCategory as "MARKETING" | "UTILITY" | "AUTHENTICATION",
      components,
      allow_category_change: true,
    });

    setSaving(false);
    if (result.ok) {
      setShowForm(false);
      setTName(""); setTBody(""); setTHeader(""); setTFooter(""); setTButtons([]);
      notify.success("Template submitted for review");
      void load();
    } else {
      const errData = result.data as { error?: { message?: string } };
      notify.error(errData?.error?.message ?? "Failed to create template");
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Templates</h1>
          <p className="mt-1 text-sm text-warm-500">{templates.length} templates · {templates.filter((t) => t.status === "APPROVED").length} approved</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" loading={refreshing} onClick={handleRefresh} aria-label="Refresh templates">
            <RefreshCw className="size-4" aria-hidden="true" />
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" aria-hidden="true" /> New Template
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">New Template</CardTitle>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Template name" value={tName} onChange={(e) => setTName(e.target.value)} placeholder="order_confirmation" required description="Lowercase, underscores only" />
                <Dropdown label="Category" options={CATEGORY_OPTIONS} value={tCategory} onChange={setTCategory} />
                <Dropdown label="Language" options={LANGUAGE_OPTIONS} value={tLanguage} onChange={setTLanguage} />
              </div>
              <Input label="Header (optional)" value={tHeader} onChange={(e) => setTHeader(e.target.value)} placeholder="Your order is ready!" description="Plain text header. Use {{1}} for variables." />
              <div>
                <label htmlFor="template-body" className="block text-sm font-medium text-near-black mb-1">Body <span className="text-danger">*</span></label>
                <textarea
                  id="template-body"
                  value={tBody}
                  onChange={(e) => setTBody(e.target.value)}
                  placeholder="Hi {{1}}, your order {{2}} has been confirmed and will arrive by {{3}}."
                  rows={4}
                  required
                  className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
                />
                <p className="mt-1 text-xs text-warm-500">Use {"{{1}}"}, {"{{2}}"} etc. for variable placeholders.</p>
              </div>
              <Input label="Footer (optional)" value={tFooter} onChange={(e) => setTFooter(e.target.value)} placeholder="Reply STOP to opt out" />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-near-black">Buttons (optional)</label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setTButtons([...tButtons, makeButton()])}
                  >
                    Add Button
                  </Button>
                </div>
                {tButtons.map((btn) => (
                  <div key={btn._key} className="flex gap-2 mb-2 items-end flex-wrap">
                    <Dropdown
                      label="Type"
                      options={[{ label: "Quick Reply", value: "QUICK_REPLY" }, { label: "URL", value: "URL" }]}
                      value={btn.type}
                      onChange={(v) => setTButtons(tButtons.map((b) => b._key === btn._key ? { ...b, type: v } : b))}
                    />
                    <Input
                      label="Text"
                      value={btn.text}
                      onChange={(e) => setTButtons(tButtons.map((b) => b._key === btn._key ? { ...b, text: e.target.value } : b))}
                      placeholder="Button text"
                    />
                    {btn.type === "URL" && (
                      <Input
                        label="URL"
                        value={btn.url}
                        onChange={(e) => setTButtons(tButtons.map((b) => b._key === btn._key ? { ...b, url: e.target.value } : b))}
                        placeholder="https://..."
                      />
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setTButtons(tButtons.filter((b) => b._key !== btn._key))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" loading={saving}>Submit for Review</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        title={preview?.name ?? "Template"}
        description={preview ? `${preview.language} · ${preview.category}` : undefined}
        size="lg"
        footer={
          preview ? (
            <Badge variant={STATUS_VARIANT[preview.status] ?? "default"}>{preview.status}</Badge>
          ) : null
        }
      >
        {preview && (
          <>
            <div className="bg-[#e5ddd5] rounded-lg p-4 space-y-1 font-sans text-sm">
              {preview.components.map((comp, i) => (
                <div key={`${comp.type}-${i}`}>
                  {comp.type === "HEADER" && <p className="font-semibold">{comp.text}</p>}
                  {comp.type === "BODY" && <p className="whitespace-pre-wrap">{comp.text}</p>}
                  {comp.type === "FOOTER" && <p className="text-xs text-gray-500">{comp.text}</p>}
                  {comp.type === "BUTTONS" && (
                    <div className="pt-2 border-t border-black/10 flex flex-wrap gap-2 mt-2">
                      {comp.buttons?.map((btn, j) => (
                        <span key={`${btn.text}-${j}`} className="text-blue-600 text-xs border border-blue-200 rounded px-2 py-1">{btn.text}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {preview.rejected_reason && (
              <p className="mt-3 text-sm text-danger bg-red-50 rounded p-2">Rejection reason: {preview.rejected_reason}</p>
            )}
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : "Delete template?"}
        description="This permanently removes the template from your WhatsApp Business Account. This cannot be undone."
        confirmLabel="Delete"
        destructive
      />

      {!showForm ? <TemplateGallery onUse={applyPreset} /> : null}

      {templates.length === 0 ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center text-sm text-warm-500">
            No templates yet. Create one above or check back after Meta approves your submission.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-near-black">{template.name}</span>
                      <Badge variant={STATUS_VARIANT[template.status] ?? "default"}>{template.status}</Badge>
                      <span className="text-xs text-warm-500 bg-warm-100 rounded px-1.5 py-0.5">{template.category}</span>
                      <span className="text-xs text-warm-500">{template.language}</span>
                    </div>
                    <p className="mt-1 text-xs text-warm-500 truncate">
                      {template.components.find((c) => c.type === "BODY")?.text?.slice(0, 120) ?? "—"}
                    </p>
                    {template.rejected_reason && (
                      <p className="mt-1 text-xs text-danger">{template.rejected_reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreview(template)}
                      aria-label={`Preview ${template.name}`}
                      className="p-1.5 text-warm-500 hover:text-near-black rounded transition-colors"
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </button>
                    <a
                      href="https://business.facebook.com/wa/manage/message-templates/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Edit ${template.name} in Meta Business Manager`}
                      className="p-1.5 text-warm-500 hover:text-near-black rounded transition-colors"
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(template)}
                      aria-label={`Delete ${template.name}`}
                      className="p-1.5 text-warm-500 hover:text-danger rounded transition-colors"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-warm-500 text-right">
        Template variables use {"{{"} 1 {"}}"}, {"{{"} 2 {"}}"} notation per Meta spec.
        Templates are reviewed by Meta within 24h.{" "}
        <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates" target="_blank" rel="noopener noreferrer" className="text-notion-blue hover:underline">
          Docs <ExternalLink className="size-3 inline" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
