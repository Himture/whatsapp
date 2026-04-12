"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { JSX, ReactNode } from "react";
import { clearKey } from "@/lib/crypto";

export type SessionMode = "local" | "authenticated" | "none";

const STORAGE_KEY = "session-mode";

interface SessionModeContextValue {
  mode: SessionMode;
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

function readStoredMode(): SessionMode {
  if (typeof window === "undefined") return "none";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "local" || stored === "authenticated") return stored;
  return "none";
}

export function SessionModeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [mode, setMode] = useState<SessionMode>(readStoredMode);

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
