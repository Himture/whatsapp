"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getContactStore, getFlowStore, getInboxStore } from "@/lib/stores";
import { useSessionMode } from "@/lib/session-mode";
import { useLocalStorageValue, useSetLocalStorage } from "@/hooks/use-local-storage";
import { ROUTES } from "@/lib/constants";
import { isDemoActive } from "@/lib/demo-seed";

const DISMISSED_KEY = "first-run-wizard-dismissed";

interface Step {
  title: string;
  description: string;
  href: string;
  cta: string;
}

const STEPS: Step[] = [
  { title: "Connect WhatsApp", description: "Add your Meta access token, phone number ID, and WABA ID — without these the app can't send anything to graph.facebook.com.", href: ROUTES.SETTINGS, cta: "Open Settings" },
  { title: "Add your first contact", description: "Import a CSV or add manually so broadcasts and one-to-one sends have someone to go to.", href: ROUTES.CONTACTS, cta: "Go to Contacts" },
  { title: "Send a test message", description: "Confirm Meta accepts your credentials before you trust them with a broadcast.", href: ROUTES.MESSAGES, cta: "Send Message" },
  { title: "Set up your webhook", description: "Point Meta to your webhook URL so inbox, analytics, and auto-replies come alive.", href: ROUTES.SETTINGS, cta: "View Webhook URL" },
  { title: "Create an auto-reply", description: "Catch greetings and keywords automatically so off-hours messages still feel responsive.", href: ROUTES.FLOWS, cta: "Create Rule" },
];

export function FirstRunWizard() {
  const { mode } = useSessionMode();
  const { configs, loading } = useWhatsAppConfig();
  const dismissedFlag = useLocalStorageValue(DISMISSED_KEY);
  const setDismissedFlag = useSetLocalStorage(DISMISSED_KEY);
  const dismissed = dismissedFlag === "1";
  const [completed, setCompleted] = useState<boolean[]>([false, false, false, false, false]);

  useEffect(() => {
    if (loading || dismissed) return;
    if (mode === "loading") return;
    if (isDemoActive()) return;

    let cancelled = false;
    const storeMode = mode === "authenticated" ? ("remote" as const) : ("local" as const);

    async function computeProgress() {
      const hasConfig = configs.length > 0;
      if (!hasConfig) {
        if (!cancelled) setCompleted([false, false, false, false, false]);
        return;
      }
      const activeConfig = configs.find((c) => c.isDefault) ?? configs[0];
      if (!activeConfig) return;

      const [contacts, rules, messages] = await Promise.all([
        getContactStore(storeMode).getContacts(),
        getFlowStore(storeMode).getRules(activeConfig.id),
        getInboxStore(storeMode).getMessages(activeConfig.id, ""),
      ]);

      if (cancelled) return;
      setCompleted([
        true,
        contacts.length > 0,
        messages.length > 0 || contacts.length > 0,
        messages.length > 0,
        rules.length > 0,
      ]);
    }

    void computeProgress();
    return () => { cancelled = true; };
  }, [mode, configs, loading, dismissed]);

  function handleDismiss() {
    setDismissedFlag("1");
  }

  if (dismissed || loading || mode === "loading" || isDemoActive()) return null;

  const doneCount = completed.filter(Boolean).length;
  if (doneCount === STEPS.length) return null;

  return (
    <section className="mb-6 rounded-[var(--radius-subtle)] border border-black/10 bg-warm-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-warm-500">Getting started</p>
          <h2 className="mt-0.5 text-lg font-semibold text-near-black">
            {doneCount} of {STEPS.length} steps complete
          </h2>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-warm-500 hover:text-near-black transition-colors"
          aria-label="Dismiss setup guide"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 h-1.5 bg-warm-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-notion-blue rounded-full transition-all duration-300"
          style={{ width: `${(doneCount / STEPS.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 space-y-1">
        {STEPS.map((step, i) => {
          const isDone = completed[i];
          const isNext = !isDone && completed.slice(0, i).every(Boolean);
          return (
            <li key={step.title}>
              <Link
                href={step.href}
                className={`flex items-center gap-3 rounded-[var(--radius-micro)] px-3 py-2 text-sm transition-colors ${isNext ? "bg-white ring-1 ring-notion-blue/30" : "hover:bg-white/60"}`}
              >
                <span className={`flex size-5 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${isDone ? "bg-green-500 text-white" : "bg-warm-100 text-warm-500"}`}>
                  {isDone ? <Check className="size-3" /> : i + 1}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block font-medium ${isDone ? "text-warm-500 line-through" : "text-near-black"}`}>
                    {step.title}
                  </span>
                  <span className="block text-xs text-warm-500 truncate">{step.description}</span>
                </span>
                {!isDone ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-notion-blue shrink-0">
                    {step.cta} <ChevronRight className="size-3" />
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
