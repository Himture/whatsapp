"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiCallResult } from "@/lib/types";

const FIELD_LABELS = {
  RECIPIENT: "Recipient Phone Number",
  MESSAGE_ID: "Message ID",
  EMOJI: "Emoji",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  MESSAGE_ID: "wamid.xxx",
  EMOJI: "e.g. \uD83D\uDC4D",
} as const;

export function ReactionForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [messageId, setMessageId] = useState("");
  const [emoji, setEmoji] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const response = await messagesApi.sendReaction(
        activeConfig,
        recipient,
        messageId,
        emoji,
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
        label={FIELD_LABELS.MESSAGE_ID}
        placeholder={PLACEHOLDERS.MESSAGE_ID}
        value={messageId}
        onChange={(e) => setMessageId(e.target.value)}
        required
        description="The ID of the message to react to"
      />

      <Input
        label={FIELD_LABELS.EMOJI}
        placeholder={PLACEHOLDERS.EMOJI}
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        required
        description="A single emoji character. Send empty string to remove reaction."
      />

      <Button type="submit" loading={loading}>
        Send Reaction
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
