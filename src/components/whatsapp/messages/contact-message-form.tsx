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
  FIRST_NAME: "First Name",
  LAST_NAME: "Last Name",
  PHONE: "Phone Number",
  EMAIL: "Email",
  ORGANIZATION: "Organization",
  REPLY_TO: "Reply To Message ID",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  FIRST_NAME: "John",
  LAST_NAME: "Doe",
  PHONE: "+14155238886",
  EMAIL: "john@example.com",
  ORGANIZATION: "Acme Inc.",
  REPLY_TO: "wamid.xxx (optional)",
} as const;

export function ContactMessageForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const contact: Record<string, unknown> = {
      name: {
        formatted_name: [firstName, lastName].filter(Boolean).join(" "),
        first_name: firstName,
      },
    };
    if (lastName) {
      (contact.name as Record<string, string>).last_name = lastName;
    }
    if (phone) {
      contact.phones = [{ phone, type: "CELL" }];
    }
    if (email) {
      contact.emails = [{ email, type: "WORK" }];
    }
    if (organization) {
      contact.org = { company: organization };
    }

    setLoading(true);
    try {
      const response = await messagesApi.sendContact(
        activeConfig,
        recipient,
        [contact],
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

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={FIELD_LABELS.FIRST_NAME}
          placeholder={PLACEHOLDERS.FIRST_NAME}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <Input
          label={FIELD_LABELS.LAST_NAME}
          placeholder={PLACEHOLDERS.LAST_NAME}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <Input
        label={FIELD_LABELS.PHONE}
        placeholder={PLACEHOLDERS.PHONE}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.EMAIL}
        placeholder={PLACEHOLDERS.EMAIL}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.ORGANIZATION}
        placeholder={PLACEHOLDERS.ORGANIZATION}
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Contact
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
