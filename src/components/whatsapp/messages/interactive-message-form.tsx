"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ApiCallResult } from "@/lib/types";

const FIELD_LABELS = {
  RECIPIENT: "Recipient Phone Number",
  HEADER: "Header Text",
  BODY: "Body Text",
  FOOTER: "Footer Text",
  BUTTON_TEXT: "Button Text",
  REPLY_TO: "Reply To Message ID",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  HEADER: "Optional header text",
  BODY: "Message body text...",
  FOOTER: "Optional footer text",
  REPLY_TO: "wamid.xxx (optional)",
} as const;

const MAX_LIST_SECTIONS = 10;
const MAX_LIST_ROWS_PER_SECTION = 10;
const MAX_REPLY_BUTTONS = 3;



interface ListRow {
  id: string;
  title: string;
  description: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

function createEmptyRow(): ListRow {
  return { id: "", title: "", description: "" };
}

function createEmptySection(): ListSection {
  return { title: "", rows: [createEmptyRow()] };
}



function ListMessageForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [sections, setSections] = useState<ListSection[]>([createEmptySection()]);
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  function updateSection(sectionIdx: number, field: keyof ListSection, value: string) {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIdx ? { ...section, [field]: value } : section,
      ),
    );
  }

  function updateRow(sectionIdx: number, rowIdx: number, field: keyof ListRow, value: string) {
    setSections((prev) =>
      prev.map((section, si) =>
        si === sectionIdx
          ? {
              ...section,
              rows: section.rows.map((row, ri) =>
                ri === rowIdx ? { ...row, [field]: value } : row,
              ),
            }
          : section,
      ),
    );
  }

  function addRow(sectionIdx: number) {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIdx && section.rows.length < MAX_LIST_ROWS_PER_SECTION
          ? { ...section, rows: [...section.rows, createEmptyRow()] }
          : section,
      ),
    );
  }

  function removeRow(sectionIdx: number, rowIdx: number) {
    setSections((prev) =>
      prev.map((section, i) =>
        i === sectionIdx && section.rows.length > 1
          ? { ...section, rows: section.rows.filter((_, ri) => ri !== rowIdx) }
          : section,
      ),
    );
  }

  function addSection() {
    if (sections.length < MAX_LIST_SECTIONS) {
      setSections((prev) => [...prev, createEmptySection()]);
    }
  }

  function removeSection(sectionIdx: number) {
    if (sections.length > 1) {
      setSections((prev) => prev.filter((_, i) => i !== sectionIdx));
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const interactive: Record<string, unknown> = {
      body: { text: bodyText },
      action: {
        button: buttonText,
        sections: sections.map((section) => ({
          title: section.title,
          rows: section.rows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description || undefined,
          })),
        })),
      },
    };
    if (headerText) interactive.header = { type: "text", text: headerText };
    if (footerText) interactive.footer = { text: footerText };

    setLoading(true);
    try {
      const response = await messagesApi.sendInteractiveList(
        activeConfig,
        recipient,
        interactive,
        replyToMessageId || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.HEADER}
        placeholder={PLACEHOLDERS.HEADER}
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
      />

      <Textarea
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.FOOTER}
        placeholder={PLACEHOLDERS.FOOTER}
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.BUTTON_TEXT}
        placeholder="e.g. View Options"
        value={buttonText}
        onChange={(e) => setButtonText(e.target.value)}
        required
        description="Text displayed on the list CTA button"
      />

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-near-black">Sections</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addSection}
            disabled={sections.length >= MAX_LIST_SECTIONS}
          >
            Add Section
          </Button>
        </div>

        {sections.map((section, si) => (
          <div
            key={si}
            className="rounded-[var(--radius-standard)] border border-[#ddd] p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-near-black">
                Section {si + 1}
              </span>
              {sections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(si)}
                >
                  Remove
                </Button>
              )}
            </div>

            <Input
              label="Section Title"
              placeholder="e.g. Category A"
              value={section.title}
              onChange={(e) => updateSection(si, "title", e.target.value)}
              required
            />

            {section.rows.map((row, ri) => (
              <div key={ri} className="ml-4 space-y-2 border-l-2 border-black/5 pl-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-warm-500">
                    Row {ri + 1}
                  </span>
                  {section.rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(si, ri)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <Input
                  label="Row ID"
                  placeholder="unique-row-id"
                  value={row.id}
                  onChange={(e) => updateRow(si, ri, "id", e.target.value)}
                  required
                />
                <Input
                  label="Row Title"
                  placeholder="Row title"
                  value={row.title}
                  onChange={(e) => updateRow(si, ri, "title", e.target.value)}
                  required
                />
                <Input
                  label="Row Description"
                  placeholder="Optional description"
                  value={row.description}
                  onChange={(e) => updateRow(si, ri, "description", e.target.value)}
                />
              </div>
            ))}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addRow(si)}
              disabled={section.rows.length >= MAX_LIST_ROWS_PER_SECTION}
            >
              Add Row
            </Button>
          </div>
        ))}
      </div>

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send List Message
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}



interface ReplyButton {
  id: string;
  title: string;
}

function createEmptyButton(): ReplyButton {
  return { id: "", title: "" };
}



function ReplyButtonsForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [headerText, setHeaderText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [buttons, setButtons] = useState<ReplyButton[]>([createEmptyButton()]);
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  function updateButton(idx: number, field: keyof ReplyButton, value: string) {
    setButtons((prev) =>
      prev.map((btn, i) => (i === idx ? { ...btn, [field]: value } : btn)),
    );
  }

  function addButton() {
    if (buttons.length < MAX_REPLY_BUTTONS) {
      setButtons((prev) => [...prev, createEmptyButton()]);
    }
  }

  function removeButton(idx: number) {
    if (buttons.length > 1) {
      setButtons((prev) => prev.filter((_, i) => i !== idx));
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const interactive: Record<string, unknown> = {
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn) => ({
          type: "reply",
          reply: { id: btn.id, title: btn.title },
        })),
      },
    };
    if (headerText) interactive.header = { type: "text", text: headerText };
    if (footerText) interactive.footer = { text: footerText };

    setLoading(true);
    try {
      const response = await messagesApi.sendInteractiveButtons(
        activeConfig,
        recipient,
        interactive,
        replyToMessageId || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.HEADER}
        placeholder={PLACEHOLDERS.HEADER}
        value={headerText}
        onChange={(e) => setHeaderText(e.target.value)}
      />

      <Textarea
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={bodyText}
        onChange={(e) => setBodyText(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.FOOTER}
        placeholder={PLACEHOLDERS.FOOTER}
        value={footerText}
        onChange={(e) => setFooterText(e.target.value)}
      />

      {/* Buttons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-near-black">
            Reply Buttons (max {MAX_REPLY_BUTTONS})
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={addButton}
            disabled={buttons.length >= MAX_REPLY_BUTTONS}
          >
            Add Button
          </Button>
        </div>

        {buttons.map((btn, i) => (
          <div
            key={i}
            className="flex items-end gap-3 rounded-[var(--radius-standard)] border border-[#ddd] p-3"
          >
            <Input
              label="Button ID"
              placeholder="unique-btn-id"
              value={btn.id}
              onChange={(e) => updateButton(i, "id", e.target.value)}
              required
            />
            <Input
              label="Button Title"
              placeholder="e.g. Yes"
              value={btn.title}
              onChange={(e) => updateButton(i, "title", e.target.value)}
              required
            />
            {buttons.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeButton(i)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Reply Buttons
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}



export function InteractiveMessageForm() {
  return (
    <Tabs defaultValue="list">
      <TabsList>
        <TabsTrigger value="list">List Message</TabsTrigger>
        <TabsTrigger value="buttons">Reply Buttons</TabsTrigger>
      </TabsList>
      <TabsContent value="list">
        <ListMessageForm />
      </TabsContent>
      <TabsContent value="buttons">
        <ReplyButtonsForm />
      </TabsContent>
    </Tabs>
  );
}
