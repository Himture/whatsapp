"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { JSX, ReactNode } from "react";
import { clearKey } from "@/lib/crypto";

export type SessionMode = "local" | "authenticated" | "none";
type HydratedMode = SessionMode | "loading";

const STORAGE_KEY = "session-mode";

interface SessionModeContextValue {
  mode: HydratedMode;
  enterLocalMode: () => void;
  enterAuthenticatedMode: () => void;
  signOutAll: () => void;
}

const SessionModeContext = createContext<SessionModeContextValue | null>(null);

export function useSessionMode(): SessionModeContextValue {
  const ctx = useContext(SessionModeContext);
  if (!ctx) {
    throw new Error("useSessionMode must be used within a SessionModeProvider");
  }
  return ctx;
}

export function SessionModeProvider({ children }: { children: ReactNode }): JSX.Element {
  // Start as "loading" to match SSR output, then read localStorage on mount.
  // Reading storage during useState init would cause a hydration mismatch.
  const [mode, setMode] = useState<HydratedMode>("loading");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "local" || stored === "authenticated") {
      setMode(stored);
    } else {
      setMode("none");
    }
  }, []);

  const enterLocalMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "local");
    setMode("local");
  }, []);

  const enterAuthenticatedMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "authenticated");
    setMode("authenticated");
  }, []);

  const signOutAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearKey();
    setMode("none");
  }, []);

  return (
    <SessionModeContext.Provider value={{ mode, enterLocalMode, enterAuthenticatedMode, signOutAll }}>
      {children}
    </SessionModeContext.Provider>
  );
}
