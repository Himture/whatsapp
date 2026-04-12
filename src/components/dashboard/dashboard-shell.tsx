"use client";

import { useState, useCallback, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { WhatsAppConfigProvider } from "@/hooks/use-whatsapp-config";
import { useSessionMode } from "@/lib/session-mode";
import { useSession } from "@/lib/auth-client";
import { ROUTES } from "@/lib/constants";

interface DashboardShellProps {
  children: ReactNode;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { mode } = useSessionMode();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (mode === "none") {
      router.replace(ROUTES.LOGIN);
      return;
    }
    if (mode === "authenticated" && !isPending && !session) {
      router.replace(ROUTES.LOGIN);
    }
  }, [mode, session, isPending, router]);

  if (mode === "none") {
    return null;
  }

  if (mode === "authenticated" && isPending) {
    return null;
  }

  if (mode === "authenticated" && !session) {
    return null;
  }

  return <>{children}</>;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <WhatsAppConfigProvider>
            <Header onMenuToggle={handleMenuToggle} />
            <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6">
              {children}
            </main>
          </WhatsAppConfigProvider>
        </div>
      </div>
    </AuthGate>
  );
}
