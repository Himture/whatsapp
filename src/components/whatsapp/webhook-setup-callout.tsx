"use client";

import { useState } from "react";
import { Copy, Check, Info, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalStorageValue, useSetLocalStorage } from "@/hooks/use-local-storage";

interface WebhookSetupCalloutProps {
  configId: string;
  verifyToken: string;
  dismissible?: boolean;
  variant?: "default" | "inline";
}

export function WebhookSetupCallout({
  configId,
  verifyToken,
  dismissible = true,
  variant = "default",
}: WebhookSetupCalloutProps) {
  const storageKey = "webhook-callout-dismissed-" + configId;
  const dismissedFlag = useLocalStorageValue(storageKey);
  const setDismissedFlag = useSetLocalStorage(storageKey);
  const [copiedField, setCopiedField] = useState<"url" | "token" | null>(null);

  if (dismissible && dismissedFlag === "1") return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const webhookUrl = `${origin}/api/webhooks/${configId}`;

  async function handleCopy(value: string, field: "url" | "token") {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleDismiss() {
    setDismissedFlag("1");
  }

  const wrapperClass = variant === "inline"
    ? "rounded-[var(--radius-micro)] bg-warm-white border border-black/10 p-3"
    : "rounded-[var(--radius-subtle)] bg-blue-50 border border-blue-200 p-4";

  return (
    <section className={wrapperClass}>
      <div className="flex items-start gap-3">
        <Info className={`size-4 shrink-0 mt-0.5 ${variant === "inline" ? "text-warm-500" : "text-blue-600"}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${variant === "inline" ? "text-near-black" : "text-blue-900"}`}>
            Point Meta to this webhook
          </p>
          <p className={`text-xs mt-0.5 ${variant === "inline" ? "text-warm-500" : "text-blue-700"}`}>
            Inbox, analytics, and auto-replies need this. Paste these into WhatsApp → Configuration → Webhooks in Meta Business Manager.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-warm-500 w-20 shrink-0">Callback URL</span>
              <code className="font-mono text-xs text-near-black bg-white border border-black/10 rounded px-2 py-1 flex-1 truncate" suppressHydrationWarning>
                {webhookUrl}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(webhookUrl, "url")}
                className="shrink-0 text-warm-500 hover:text-notion-blue transition-colors"
                aria-label="Copy webhook URL"
              >
                {copiedField === "url" ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-warm-500 w-20 shrink-0">Verify token</span>
              <code className="font-mono text-xs text-near-black bg-white border border-black/10 rounded px-2 py-1 flex-1 truncate">
                {verifyToken || "—"}
              </code>
              <button
                type="button"
                onClick={() => handleCopy(verifyToken, "token")}
                className="shrink-0 text-warm-500 hover:text-notion-blue transition-colors"
                aria-label="Copy verify token"
              >
                {copiedField === "token" ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-notion-blue hover:underline"
            >
              How to configure in Meta <ExternalLink className="size-3" />
            </a>
            {dismissible ? (
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Got it
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
