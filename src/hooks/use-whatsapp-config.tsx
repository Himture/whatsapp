"use client";

import { useState, useCallback, useEffect, startTransition, createContext, useContext } from "react";
import type { JSX, ReactNode } from "react";
import type { WhatsAppClientConfig } from "@/lib/types";
import type { ApiVersion } from "@/lib/constants";
import { useSessionMode } from "@/lib/session-mode";
import { getDataStore } from "@/lib/datastore";
import type { ConfigRecord } from "@/lib/datastore";

interface ConfigContextValue {
  configs: ConfigRecord[];
  activeConfig: WhatsAppClientConfig | null;
  activeConfigId: string | null;
  setActiveConfigId: (id: string) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function useWhatsAppConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useWhatsAppConfig must be used within a WhatsAppConfigProvider");
  }
  return ctx;
}

function selectDefaultConfigId(data: ConfigRecord[]): string | null {
  const defaultConfig = data.find((c) => c.isDefault);
  if (defaultConfig) return defaultConfig.id;
  if (data.length > 0 && data[0]) return data[0].id;
  return null;
}

export function WhatsAppConfigProvider({ children }: { children: ReactNode }): JSX.Element {
  const { mode } = useSessionMode();
  const [configs, setConfigs] = useState<ConfigRecord[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const refresh = useCallback(async () => {
    try {
      const store = getDataStore(storeMode);
      const data = await store.getConfigs();
      setConfigs(data);
      // Functional updater reads current value without needing activeConfigId
      // as a dependency, keeping refresh stable across renders.
      setActiveConfigId((current) => current ?? selectDefaultConfigId(data));
    } catch {
      console.error("Failed to load WhatsApp configs");
    } finally {
      setLoading(false);
    }
  }, [storeMode]);

  useEffect(() => {
    startTransition(() => {
      void refresh();
    });
  }, [refresh]);

  const activeEntry = configs.find((c) => c.id === activeConfigId);
  const activeConfig: WhatsAppClientConfig | null = activeEntry
    ? {
        accessToken: activeEntry.accessToken,
        phoneNumberId: activeEntry.phoneNumberId,
        wabaId: activeEntry.wabaId,
        businessPortfolioId: activeEntry.businessPortfolioId ?? undefined,
        version: activeEntry.apiVersion as ApiVersion,
      }
    : null;

  return (
    <ConfigContext.Provider value={{
      configs,
      activeConfig,
      activeConfigId,
      setActiveConfigId,
      loading,
      refresh,
    }}>
      {children}
    </ConfigContext.Provider>
  );
}
