"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionMode } from "@/lib/session-mode";
import { ROUTES } from "@/lib/constants";

export default function HomePage() {
  const router = useRouter();
  const { mode } = useSessionMode();

  useEffect(() => {
    if (mode === "loading") return;
    if (mode === "local" || mode === "authenticated") {
      router.replace(ROUTES.DASHBOARD);
    } else {
      router.replace(ROUTES.LOGIN);
    }
  }, [mode, router]);

  return null;
}
