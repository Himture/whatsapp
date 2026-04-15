"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface RequestHistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number;
  duration: number;
  requestBody: unknown;
  responseBody: unknown;
}

const STORAGE_KEY = "whatsapp-api-history";
const CUSTOM_EVENT = "request-history-change";
const MAX_ENTRIES = 50;
const EMPTY: RequestHistoryEntry[] = [];

function loadHistory(): RequestHistoryEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as RequestHistoryEntry[];
  } catch {
    return EMPTY;
  }
}

function saveHistory(entries: RequestHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(CUSTOM_EVENT));
  } catch {
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CUSTOM_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CUSTOM_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// useSyncExternalStore needs a stable snapshot reference between renders so
// React doesn't tear. Cache the parsed array until something invalidates it.
let cachedSnapshot: RequestHistoryEntry[] = EMPTY;
let cachedRaw: string | null = null;
function getSnapshot(): RequestHistoryEntry[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = raw ? (JSON.parse(raw) as RequestHistoryEntry[]) : EMPTY;
  return cachedSnapshot;
}

interface UseRequestHistoryReturn {
  history: RequestHistoryEntry[];
  addEntry: (entry: RequestHistoryEntry) => void;
  clearHistory: () => void;
}

export function useRequestHistory(): UseRequestHistoryReturn {
  const history = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const addEntry = useCallback((entry: RequestHistoryEntry) => {
    const next = [entry, ...loadHistory()].slice(0, MAX_ENTRIES);
    saveHistory(next);
  }, []);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
