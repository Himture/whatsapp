"use client";

import { createContext, useContext, useCallback, useEffect, useSyncExternalStore } from "react";
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

// Mirror the mode into a cookie so middleware can recognise local mode (which has
// no server session). Non-HttpOnly by design — no security-sensitive data rides on
// it; in local mode there's nothing server-side to protect anyway.
function writeModeCookie(value: SessionMode | null): void {
  if (typeof document === "undefined") return;
  document.cookie = value
    ? `${STORAGE_KEY}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    : `${STORAGE_KEY}=; path=/; max-age=0; samesite=lax`;
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

  // Keep the cookie in sync with the stored mode (covers existing installs whose
  // localStorage predates the cookie).
  useEffect(() => {
    if (mode === "local" || mode === "authenticated") writeModeCookie(mode);
    else if (mode === "none") writeModeCookie(null);
  }, [mode]);

  const enterLocalMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "local");
    writeModeCookie("local");
    notifyChange();
  }, []);

  const enterAuthenticatedMode = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "authenticated");
    writeModeCookie("authenticated");
    notifyChange();
  }, []);

  const signOutAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    writeModeCookie(null);
    clearKey();
    notifyChange();
  }, []);

  return (
    <SessionModeContext.Provider value={{ mode, enterLocalMode, enterAuthenticatedMode, signOutAll }}>
      {children}
    </SessionModeContext.Provider>
  );
}
