"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiCallResult } from "@/lib/types";

const FIELD_LABELS = {
  MESSAGE_ID: "Message ID",
} as const;

const PLACEHOLDERS = {
  MESSAGE_ID: "wamid.xxx",
} as const;

export function MarkReadForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [messageId, setMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const response = await messagesApi.markAsRead(activeConfig, messageId);
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.MESSAGE_ID}
        placeholder={PLACEHOLDERS.MESSAGE_ID}
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
        required
        description="The ID of the incoming message to mark as read"
      />

      <Button type="submit" loading={loading}>
        Mark as Read
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
