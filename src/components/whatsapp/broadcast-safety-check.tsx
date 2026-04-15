"use client";

import { useMemo } from "react";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { META_RATES_INR } from "@/lib/constants";
import { isValidPhoneNumber } from "@/lib/utils";

interface Recipient {
  phone: string;
  name?: string | null;
}

interface BroadcastSafetyCheckProps {
  open: boolean;
  recipients: Recipient[];
  messageType: "text" | "template" | string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

interface Issue {
  level: "error" | "warning" | "info";
  title: string;
  detail: string;
}

function isE164(phone: string): boolean {
  if (!isValidPhoneNumber(phone)) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

function analyzeRecipients(recipients: Recipient[]): {
  valid: Recipient[];
  invalid: string[];
  duplicates: number;
} {
  const seen = new Set<string>();
  const valid: Recipient[] = [];
  const invalid: string[] = [];
  let duplicates = 0;
  for (const r of recipients) {
    const phone = r.phone.trim();
    if (!isE164(phone)) {
      invalid.push(phone);
      continue;
    }
    if (seen.has(phone)) {
      duplicates++;
      continue;
    }
    seen.add(phone);
    valid.push(r);
  }
  return { valid, invalid, duplicates };
}

function currentHourInIndia(): number {
  const now = new Date();
  return (now.getUTCHours() + 5) % 24;
}

export function BroadcastSafetyCheck({
  open,
  recipients,
  messageType,
  onCancel,
  onConfirm,
  loading,
}: BroadcastSafetyCheckProps) {
  const analysis = useMemo(() => analyzeRecipients(recipients), [recipients]);

  const issues = useMemo<Issue[]>(() => {
    const result: Issue[] = [];
    if (analysis.invalid.length > 0) {
      result.push({
        level: "error",
        title: `${analysis.invalid.length} invalid phone numbers`,
        detail: "These will be skipped. Numbers must be in E.164 format (+countrycode, no spaces).",
      });
    }
    if (analysis.duplicates > 0) {
      result.push({
        level: "warning",
        title: `${analysis.duplicates} duplicates removed`,
        detail: "Each recipient receives only one message.",
      });
    }
    const hour = currentHourInIndia();
    if (hour >= 22 || hour < 8) {
      result.push({
        level: "warning",
        title: "Sending outside business hours (IST)",
        detail: "Messages sent late at night or early morning typically see lower read rates and higher opt-outs.",
      });
    }
    if (analysis.valid.length >= 1000) {
      result.push({
        level: "info",
        title: "Large broadcast",
        detail: "If your phone number quality rating drops below GREEN, Meta will restrict your daily message limit. Monitor it during the send.",
      });
    }
    return result;
  }, [analysis]);

  const estimatedCost = messageType === "template" || messageType === "text"
    ? analysis.valid.length * META_RATES_INR.marketing
    : 0;

  return (
    <Dialog
      open={open}
      onClose={loading ? () => {} : onCancel}
      title="Send this broadcast?"
      description={`Sending to ${analysis.valid.length.toLocaleString("en-IN")} ${analysis.valid.length === 1 ? "recipient" : "recipients"}. Estimated Meta cost: ₹${estimatedCost.toFixed(2)}.`}
      size="lg"
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={loading} disabled={analysis.valid.length === 0}>
            Send {analysis.valid.length.toLocaleString("en-IN")} messages
          </Button>
        </>
      }
    >
      {issues.length > 0 ? (
        <ul className="space-y-2">
          {issues.map((issue) => {
            const Icon = issue.level === "error" ? XCircle : issue.level === "warning" ? AlertTriangle : CheckCircle;
            const colorClass = issue.level === "error" ? "text-danger" : issue.level === "warning" ? "text-amber-600" : "text-notion-blue";
            return (
              <li key={issue.title} className="flex items-start gap-2 rounded-[var(--radius-micro)] bg-warm-white p-3">
                <Icon className={`size-4 shrink-0 mt-0.5 ${colorClass}`} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-near-black">{issue.title}</p>
                  <p className="text-xs text-warm-500 mt-0.5">{issue.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-[var(--radius-micro)] bg-green-50 border border-green-200 p-3">
          <p className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="size-4" aria-hidden="true" /> All recipients look good. Ready to send.
          </p>
        </div>
      )}
    </Dialog>
  );
}
