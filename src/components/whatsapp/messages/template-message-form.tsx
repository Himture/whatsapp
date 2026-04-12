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
  TEMPLATE_NAME: "Template Name",
  LANGUAGE_CODE: "Language Code",
  COMPONENTS_JSON: "Components JSON",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  TEMPLATE_NAME: "e.g. hello_world",
  LANGUAGE_CODE: "e.g. en_US",
  COMPONENTS_JSON: '[{"type": "body", "parameters": [{"type": "text", "text": "Hello"}]}]',
} as const;

export function TemplateMessageForm() {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("en_US");
  const [componentsJson, setComponentsJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [jsonError, setJsonError] = useState("");

  function parseComponents(): Array<Record<string, unknown>> | undefined {
    const trimmed = componentsJson.trim();
    if (!trimmed) return undefined;

    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        setJsonError("Components must be a JSON array");
        return undefined;
      }
      setJsonError("");
      return parsed as Array<Record<string, unknown>>;
    } catch {
      setJsonError("Invalid JSON format");
      return undefined;
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const components = parseComponents();
    if (componentsJson.trim() && !components) return;

    setLoading(true);
    try {
      const response = await messagesApi.sendTemplate(
        activeConfig,
        recipient,
        templateName,
        languageCode,
        components,
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
        label={FIELD_LABELS.TEMPLATE_NAME}
        placeholder={PLACEHOLDERS.TEMPLATE_NAME}
        value={templateName}
        onChange={(e) => setTemplateName(e.target.value)}
        required
      />

      <Input
        label={FIELD_LABELS.LANGUAGE_CODE}
        placeholder={PLACEHOLDERS.LANGUAGE_CODE}
        value={languageCode}
        onChange={(e) => setLanguageCode(e.target.value)}
        required
      />

      <Textarea
        label={FIELD_LABELS.COMPONENTS_JSON}
        placeholder={PLACEHOLDERS.COMPONENTS_JSON}
        description="Optional. Provide template components as a JSON array."
        value={componentsJson}
        onChange={(e) => {
          setComponentsJson(e.target.value);
          if (jsonError) setJsonError("");
        }}
        error={jsonError}
      />

      <Button type="submit" loading={loading}>
        Send Template Message
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}
