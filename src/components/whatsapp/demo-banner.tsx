"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearDemoData } from "@/lib/demo-seed";
import { useSessionMode } from "@/lib/session-mode";
import { useLocalStorageValue } from "@/hooks/use-local-storage";
import { ROUTES } from "@/lib/constants";

export function DemoBanner() {
  const router = useRouter();
  const { signOutAll } = useSessionMode();
  const active = useLocalStorageValue("demo-mode-active") === "1";
  const [exiting, setExiting] = useState(false);

  if (!active) return null;

  async function handleExit() {
    setExiting(true);
    await clearDemoData();
    signOutAll();
    router.push(ROUTES.LOGIN);
  }

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm" role="status">
      <Sparkles className="size-4 text-amber-700 shrink-0" aria-hidden="true" />
      <p className="flex-1 text-amber-900">
        <span className="font-semibold">Demo mode.</span> Fake data — nothing sent to real WhatsApp. Explore freely.
      </p>
      <Button size="sm" variant="ghost" onClick={handleExit} loading={exiting} className="text-amber-900 hover:text-amber-950">
        Exit demo <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
