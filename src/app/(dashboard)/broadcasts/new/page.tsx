"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getBroadcastStore, getContactStore, type MediaKind } from "@/lib/stores";
import { MediaField } from "@/components/whatsapp/media-field";
import { templatesApi, type TemplateRecord } from "@/lib/whatsapp";
import { extractTemplateFields, buildTemplateComponents, renderTemplatePreview } from "@/lib/template-vars";
import { BROADCAST_RATE_OPTIONS, ROUTES } from "@/lib/constants";
import type { ContactRecord, ContactListRecord } from "@/lib/stores";
import Link from "next/link";

const RATE_OPTIONS = BROADCAST_RATE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) }));
const MESSAGE_TYPE_OPTIONS = [
  { label: "Text message", value: "text" },
  { label: "Template", value: "template" },
  { label: "Media", value: "media" },
  { label: "Interactive buttons", value: "interactive" },
];

const MEDIA_KIND_OPTIONS: Array<{ label: string; value: MediaKind }> = [
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "Document", value: "document" },
];

const MAX_REPLY_BUTTONS = 3;

// Decide id vs link the same way the rest of the app does: a value starting with
// http(s) is a public URL, anything else is treated as a Media ID.
function mediaSourceToObject(source: string): { id?: string; link?: string } {
  return /^https?:\/\//i.test(source.trim()) ? { link: source.trim() } : { id: source.trim() };
}

export default function NewBroadcastPage() {
  const router = useRouter();
  const { mode } = useSessionMode();
  const { activeConfig, activeConfigId } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [textBody, setTextBody] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateLanguage, setTemplateLanguage] = useState("en");
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [mediaKind, setMediaKind] = useState<MediaKind>("image");
  const [mediaSource, setMediaSource] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [interactiveBody, setInteractiveBody] = useState("");
  const [buttonTitles, setButtonTitles] = useState<string[]>([""]);
  const [rateLimitMs, setRateLimitMs] = useState("100");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [lists, setLists] = useState<ContactListRecord[]>([]);
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfig) return;
    const contactStore = getContactStore(storeMode);
    const [c, l] = await Promise.all([contactStore.getContacts(), contactStore.getLists()]);
    setContacts(c.filter((contact) => !contact.optedOut));
    setLists(l);

    const tmplResult = await templatesApi.list(activeConfig);
    if (tmplResult.ok && "data" in tmplResult.data) {
      const data = tmplResult.data as { data: TemplateRecord[] };
      setTemplates(data.data.filter((t) => t.status === "APPROVED"));
    }
    setLoading(false);
  }, [mode, storeMode, activeConfig]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  function toggleContact(id: string) {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function toggleList(id: string) {
    setSelectedListIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig || !activeConfigId) { setError("No active config selected"); return; }

    // Fetch all list members in parallel (one Promise.all, not N sequential awaits).
    const contactStore = getContactStore(storeMode);
    const listMembersPerList = selectedListIds.length > 0
      ? await Promise.all(selectedListIds.map((id) => contactStore.getListMembers(id)))
      : [];

    // Merge selected contacts + list members, deduplicating by ID.
    const seen = new Set<string>(selectedContactIds);
    const recipientContacts = contacts.filter((c) => seen.has(c.id));
    for (const members of listMembersPerList) {
      for (const m of members) {
        if (!m.optedOut && !seen.has(m.id)) {
          seen.add(m.id);
          recipientContacts.push(m);
        }
      }
    }

    if (recipientContacts.length === 0) { setError("Select at least one contact or list"); return; }

    const recipients = recipientContacts.map((c) => ({
      phone: c.phone,
      name: c.name,
      contactId: c.id,
    }));

    // Every input the selected template requires must be filled — the form is
    // generated from the template, so this can't be malformed by the user.
    if (messageType === "template") {
      const missing = templateFields.find((f) => !(templateValues[f.key] ?? "").trim());
      if (missing) { setError(`Fill in: ${missing.label}`); return; }
    }

    if (messageType === "media" && !mediaSource.trim()) {
      setError("Add a media source (Media ID or URL)"); return;
    }

    const trimmedButtons = buttonTitles.map((t) => t.trim()).filter(Boolean);
    if (messageType === "interactive") {
      if (!interactiveBody.trim()) { setError("Enter the message body"); return; }
      if (trimmedButtons.length === 0) { setError("Add at least one button"); return; }
    }

    let payload: Record<string, unknown>;
    if (messageType === "text") {
      payload = { type: "text", text: { body: textBody } };
    } else if (messageType === "template") {
      payload = {
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: buildTemplateComponents(selectedTemplate, templateValues),
        },
      };
    } else if (messageType === "media") {
      payload = {
        type: "media",
        media: {
          kind: mediaKind,
          ...mediaSourceToObject(mediaSource),
          ...(mediaCaption.trim() ? { caption: mediaCaption.trim() } : {}),
        },
      };
    } else {
      payload = {
        type: "interactive",
        interactive: {
          body: { text: interactiveBody },
          action: {
            buttons: trimmedButtons.map((title, i) => ({
              type: "reply",
              reply: { id: `btn_${i + 1}`, title },
            })),
          },
        },
      };
    }

    setSaving(true);
    setError(null);

    const store = getBroadcastStore(storeMode);
    const result = await store.createBroadcast(
      {
        configId: activeConfigId,
        name,
        messageType,
        payload,
        recipientIds: recipients.map((r) => r.contactId ?? ""),
        rateLimitMs: parseInt(rateLimitMs),
      },
      recipients,
    );

    setSaving(false);
    if (result.success) {
      notify.success("Broadcast created");
      router.push(ROUTES.BROADCASTS);
    } else {
      setError(result.error ?? "Failed to create broadcast");
    }
  }

  // Single pass: build both template options and unique language set.
  const approvedTemplateOptions: Array<{ label: string; value: string }> = [];
  const seenLangs = new Set<string>();
  const templateLangOptions: Array<{ label: string; value: string }> = [];
  for (const t of templates) {
    approvedTemplateOptions.push({ label: `${t.name} (${t.language})`, value: t.name });
    if (!seenLangs.has(t.language)) {
      seenLangs.add(t.language);
      templateLangOptions.push({ label: t.language, value: t.language });
    }
  }

  // Inspect the selected template to drive a generated, required input per
  // variable it declares, plus a live preview of the resolved message.
  const selectedTemplate = templates.find((t) => t.name === templateName);
  const templateFields = extractTemplateFields(selectedTemplate);
  const preview = renderTemplatePreview(selectedTemplate, templateValues);

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={ROUTES.BROADCASTS}
          aria-label="Back to broadcasts"
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-[var(--radius-micro)] text-warm-500 hover:text-near-black hover:bg-warm-100 transition-colors focus-visible:ring-2 focus-visible:ring-focus-blue"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-near-black">New Broadcast</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-micro)] bg-red-50 p-3 text-sm text-danger" role="alert">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">Campaign Details</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} placeholder="May Newsletter" required />
              </div>
              <Dropdown label="Message type" options={MESSAGE_TYPE_OPTIONS} value={messageType} onChange={setMessageType} />
              <Dropdown label="Send rate" options={RATE_OPTIONS} value={rateLimitMs} onChange={setRateLimitMs} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-4">Message Content</CardTitle>
            {messageType === "text" && (
              <div>
                <label className="block text-sm font-medium text-near-black mb-1">Message body <span className="text-danger">*</span></label>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  placeholder="Hi {{name}}, we have a special offer for you…"
                  rows={4}
                  required
                  className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
                />
              </div>
            )}
            {messageType === "template" && (
              <div className="flex flex-col gap-3">
                {approvedTemplateOptions.length === 0 ? (
                  <p className="text-sm text-warm-500">No approved templates. <Link href={ROUTES.TEMPLATES} className="text-notion-blue hover:underline">Create one →</Link></p>
                ) : (
                  <>
                    <Dropdown
                      label="Template"
                      options={approvedTemplateOptions}
                      value={templateName}
                      onChange={(v) => { setTemplateName(v); setTemplateValues({}); }}
                      required
                    />
                    {templateLangOptions.length > 1 && (
                      <Dropdown label="Language" options={templateLangOptions} value={templateLanguage} onChange={setTemplateLanguage} />
                    )}

                    {templateName && templateFields.length === 0 && (
                      <p className="text-xs text-warm-500">This template has no variables — nothing to fill in.</p>
                    )}
                    {templateFields.map((field) => (
                      <Input
                        key={field.key}
                        label={field.label}
                        value={templateValues[field.key] ?? ""}
                        onChange={(e) => setTemplateValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={
                          field.kind === "media"
                            ? "1234567890 or https://example.com/file"
                            : field.example ?? "Enter value"
                        }
                        description={field.kind === "media" ? "Paste a Media ID from the Media page (upload → copy ID), or a public https URL." : undefined}
                        required
                      />
                    ))}

                    {templateName && (preview.headerText || preview.headerMedia || preview.body || preview.buttons.length > 0) && (
                      <div className="mt-1 rounded-[var(--radius-micro)] border border-black/10 bg-warm-white p-3">
                        <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">Preview</p>
                        {preview.headerMedia && (
                          <p className="text-xs text-warm-500 mb-1">📎 {preview.headerMedia.format} header — {preview.headerMedia.value || "no media set"}</p>
                        )}
                        {preview.headerText && <p className="text-sm font-semibold text-near-black">{preview.headerText}</p>}
                        {preview.body && <p className="text-sm text-near-black whitespace-pre-wrap mt-1">{preview.body}</p>}
                        {preview.footer && <p className="text-xs text-warm-500 mt-1">{preview.footer}</p>}
                        {preview.buttons.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {preview.buttons.map((b, i) => (
                              <span key={i} className="rounded-[var(--radius-micro)] border border-notion-blue/40 text-notion-blue px-2 py-0.5 text-xs">{b.text}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {messageType === "media" && (
              <div className="flex flex-col gap-3">
                <Dropdown
                  label="Media type"
                  options={MEDIA_KIND_OPTIONS}
                  value={mediaKind}
                  onChange={(v) => { setMediaKind(v as MediaKind); setMediaSource(""); }}
                />
                <MediaField
                  label="Media source"
                  value={mediaSource}
                  onChange={setMediaSource}
                  kindFilter={mediaKind}
                  description="Paste a Media ID, a public https URL, or pick from the library."
                  required
                />
                <Input
                  label="Caption"
                  value={mediaCaption}
                  onChange={(e) => setMediaCaption(e.target.value)}
                  placeholder="Optional caption"
                />
              </div>
            )}
            {messageType === "interactive" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-near-black mb-1">Body text <span className="text-danger">*</span></label>
                  <textarea
                    value={interactiveBody}
                    onChange={(e) => setInteractiveBody(e.target.value)}
                    placeholder="What would you like to do?"
                    rows={3}
                    className="w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-near-black">Reply buttons (max {MAX_REPLY_BUTTONS})</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setButtonTitles((prev) => prev.length < MAX_REPLY_BUTTONS ? [...prev, ""] : prev)}
                      disabled={buttonTitles.length >= MAX_REPLY_BUTTONS}
                    >
                      Add button
                    </Button>
                  </div>
                  {buttonTitles.map((title, i) => (
                    <div key={i} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Input
                          label={`Button ${i + 1} title`}
                          value={title}
                          onChange={(e) => setButtonTitles((prev) => prev.map((t, j) => j === i ? e.target.value : t))}
                          placeholder="e.g. Yes"
                        />
                      </div>
                      {buttonTitles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setButtonTitles((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-base mb-1">Recipients</CardTitle>
            <p className="text-xs text-warm-500 mb-4">Opted-out contacts are automatically excluded.</p>

            {lists.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">Lists</p>
                <div className="flex flex-wrap gap-2">
                  {lists.map((list) => (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => toggleList(list.id)}
                      className={`rounded-full px-3 py-1 text-sm border transition-colors ${selectedListIds.includes(list.id) ? "bg-notion-blue text-white border-notion-blue" : "border-input-border text-warm-500 hover:border-notion-blue hover:text-near-black"}`}
                    >
                      {list.name} ({list.memberCount})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">
                Individual contacts ({selectedContactIds.length} selected)
              </p>
              <div className="max-h-48 overflow-y-auto rounded border border-input-border">
                {contacts.length === 0 ? (
                  <p className="p-3 text-sm text-warm-500">No contacts. <Link href={ROUTES.CONTACTS} className="text-notion-blue hover:underline">Add some →</Link></p>
                ) : contacts.map((contact) => (
                  <label key={contact.id} className="flex items-center gap-3 px-3 py-2 hover:bg-warm-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-near-black">{contact.name}</span>
                    <span className="text-xs text-warm-500 font-mono">{contact.phone}</span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-warm-500">
                {selectedContactIds.length === 0 && selectedListIds.length === 0
                  ? "No recipients selected yet. Pick a list above, individual contacts, or both."
                  : `Selected: ${selectedContactIds.length} contact${selectedContactIds.length === 1 ? "" : "s"}` +
                    ` + ${selectedListIds.length} list${selectedListIds.length === 1 ? "" : "s"}` +
                    ` (≈${selectedListIds.reduce((sum, id) => sum + (lists.find((l) => l.id === id)?.memberCount ?? 0), 0) + selectedContactIds.length} recipients before dedupe). ` +
                    "Duplicates and opted-out contacts are removed on send."}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={saving}>Create Broadcast</Button>
          <Link href={ROUTES.BROADCASTS}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
