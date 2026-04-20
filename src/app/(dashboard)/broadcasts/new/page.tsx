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
import { getBroadcastStore, getContactStore } from "@/lib/stores";
import { templatesApi, type TemplateRecord } from "@/lib/whatsapp";
import { BROADCAST_RATE_OPTIONS, ROUTES } from "@/lib/constants";
import type { ContactRecord, ContactListRecord } from "@/lib/stores";
import Link from "next/link";

const RATE_OPTIONS = BROADCAST_RATE_OPTIONS.map((o) => ({ label: o.label, value: String(o.value) }));
const MESSAGE_TYPE_OPTIONS = [
  { label: "Text message", value: "text" },
  { label: "Template", value: "template" },
];

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
  const [templateVars, setTemplateVars] = useState("");
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

    const payload: Record<string, unknown> = messageType === "text"
      ? { type: "text", text: { body: textBody } }
      : {
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: templateVars
              ? [{ type: "body", parameters: templateVars.split(",").map((v) => ({ type: "text", text: v.trim() })) }]
              : [],
          },
        };

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
            {messageType === "text" ? (
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
            ) : (
              <div className="flex flex-col gap-3">
                {approvedTemplateOptions.length === 0 ? (
                  <p className="text-sm text-warm-500">No approved templates. <Link href={ROUTES.TEMPLATES} className="text-notion-blue hover:underline">Create one →</Link></p>
                ) : (
                  <>
                    <Dropdown label="Template" options={approvedTemplateOptions} value={templateName} onChange={setTemplateName} required />
                    {templateLangOptions.length > 1 && (
                      <Dropdown label="Language" options={templateLangOptions} value={templateLanguage} onChange={setTemplateLanguage} />
                    )}
                    <Input label="Body variables (comma-separated)" value={templateVars} onChange={(e) => setTemplateVars(e.target.value)} placeholder="John, Order #1234, Dec 25" description="Values substituted into {{1}}, {{2}}, … in the template body." />
                  </>
                )}
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
                Total recipients: {new Set([...selectedContactIds, ...selectedListIds]).size > 0
                  ? `${selectedContactIds.length} contacts + ${selectedListIds.length} list(s)`
                  : "0"}
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
