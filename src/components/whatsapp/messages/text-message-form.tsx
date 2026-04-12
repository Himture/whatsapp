"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiCallResult } from "@/lib/types";

const FIELD_LABELS = {
  RECIPIENT: "Recipient Phone Number",
  BODY: "Message Body",
  REPLY_TO: "Reply To Message ID",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  BODY: "Enter your message text...",
  REPLY_TO: "wamid.xxx (optional)",
} as const;

export function TextMessageForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [previewUrl, setPreviewUrl] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const response = await messagesApi.sendText(
        activeConfig,
        recipient,
        body,
        {
          previewUrl,
          replyToMessageId: replyToMessageId || undefined,
        },
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

      <Textarea
        label={FIELD_LABELS.BODY}
        placeholder={PLACEHOLDERS.BODY}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
      />

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="preview-url"
          checked={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.checked)}
          className="size-4 rounded border-[#ddd] accent-notion-blue"
        />
        <label htmlFor="preview-url" className="text-sm font-medium text-near-black">
          Preview URL
        </label>
      </div>

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Text Message
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
