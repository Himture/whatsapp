"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";
import type { JSX, ReactNode } from "react";
import { clearKey } from "@/lib/crypto";

export type SessionMode = "local" | "authenticated" | "none";
type HydratedMode = SessionMode | "loading";

const STORAGE_KEY = "session-mode";
const STORAGE_EVENT = "session-mode-change";

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

function readStoredMode(): SessionMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "local" || stored === "authenticated") return stored;
  return "none";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notifyChange(): void {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function SessionModeProvider({ children }: { children: ReactNode }): JSX.Element {
  // useSyncExternalStore returns the server snapshot ("loading") during SSR
  // and the client snapshot (localStorage-backed) after hydration. This
  // avoids the hydration mismatch we'd get from reading storage in useState init.
  const mode = useSyncExternalStore<HydratedMode>(
    subscribe,
    readStoredMode,
    () => "loading",
  );

  const enterLocalMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "local");
    notifyChange();
  }, []);

  const enterAuthenticatedMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "authenticated");
    notifyChange();
  }, []);

  const signOutAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearKey();
    notifyChange();
  }, []);

  return (
    <SessionModeContext.Provider value={{ mode, enterLocalMode, enterAuthenticatedMode, signOutAll }}>
      {children}
    </SessionModeContext.Provider>
  );
}
