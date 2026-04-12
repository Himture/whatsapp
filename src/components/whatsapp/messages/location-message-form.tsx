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
  LATITUDE: "Latitude",
  LONGITUDE: "Longitude",
  NAME: "Location Name",
  ADDRESS: "Address",
  REPLY_TO: "Reply To Message ID",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  LATITUDE: "e.g. 37.4847",
  LONGITUDE: "e.g. -122.1477",
  NAME: "e.g. Menlo Park HQ",
  ADDRESS: "e.g. 1 Hacker Way, Menlo Park, CA",
  REPLY_TO: "wamid.xxx (optional)",
} as const;

export function LocationMessageForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const location: { latitude: number; longitude: number; name?: string; address?: string } = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    if (name) location.name = name;
    if (address) location.address = address;

    setLoading(true);
    try {
      const response = await messagesApi.sendLocation(
        activeConfig,
        recipient,
        location,
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
          label={FIELD_LABELS.LATITUDE}
          placeholder={PLACEHOLDERS.LATITUDE}
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          required
        />
        <Input
          label={FIELD_LABELS.LONGITUDE}
          placeholder={PLACEHOLDERS.LONGITUDE}
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          required
        />
      </div>

      <Input
        label={FIELD_LABELS.NAME}
        placeholder={PLACEHOLDERS.NAME}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.ADDRESS}
        placeholder={PLACEHOLDERS.ADDRESS}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send Location
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
