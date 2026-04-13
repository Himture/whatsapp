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

function AuthenticatedGate({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(ROUTES.LOGIN);
    }
  }, [session, isPending, router]);

  if (isPending || !session) {
    return null;
  }

  return <>{children}</>;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { mode } = useSessionMode();
  const router = useRouter();

  useEffect(() => {
    if (mode === "none") {
      router.replace(ROUTES.LOGIN);
    }
  }, [mode, router]);

  if (mode === "loading" || mode === "none") {
    return null;
  }

  if (mode === "local") {
    return <>{children}</>;
  }

  return <AuthenticatedGate>{children}</AuthenticatedGate>;
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
