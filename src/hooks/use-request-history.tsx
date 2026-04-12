"use client";

import { useState, useCallback } from "react";

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
const MAX_ENTRIES = 50;

function loadHistory(): RequestHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RequestHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: RequestHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
  }
}

interface UseRequestHistoryReturn {
  history: RequestHistoryEntry[];
  addEntry: (entry: RequestHistoryEntry) => void;
  clearHistory: () => void;
}

export function useRequestHistory(): UseRequestHistoryReturn {
  const [history, setHistory] = useState<RequestHistoryEntry[]>(loadHistory);

  const addEntry = useCallback((entry: RequestHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addEntry, clearHistory };
}
