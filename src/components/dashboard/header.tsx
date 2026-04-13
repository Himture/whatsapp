"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { useSessionMode } from "@/lib/session-mode";
import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle?: () => void;
}

function AuthenticatedEmail() {
  const { data: session } = useSession();
  return <>{session?.user?.email}</>;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { configs, activeConfigId, setActiveConfigId, loading } =
    useWhatsAppConfig();
  const { mode, signOutAll } = useSessionMode();

  async function handleSignOut() {
    if (mode === "authenticated") {
      await signOut();
    }
    signOutAll();
    router.push(ROUTES.LOGIN);
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-black/10 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger menu - mobile only */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="md:hidden inline-flex items-center justify-center rounded-[var(--radius-micro)] p-1.5 text-warm-500 hover:text-near-black transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>

        {/* Config selector */}
        {!loading && configs.length > 0 && (
          <select
            value={activeConfigId ?? ""}
            onChange={(e) => setActiveConfigId(e.target.value)}
            className="rounded-[var(--radius-micro)] border border-input-border bg-white px-2 py-1 text-sm text-near-black focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20 max-w-[160px] sm:max-w-[200px] truncate"
            aria-label="Active WhatsApp config"
          >
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.name}
              </option>
            ))}
          </select>
        )}

        {/* User info */}
        <span className="hidden md:inline text-sm text-warm-500">
          {mode === "local" ? (
            <span className="inline-flex items-center rounded-full bg-warm-100 px-2.5 py-0.5 text-xs font-medium text-warm-600">
              Local Mode
            </span>
          ) : (
            <AuthenticatedEmail />
          )}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
