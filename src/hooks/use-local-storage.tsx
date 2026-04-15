"use client";

import { useCallback, useSyncExternalStore } from "react";

const CUSTOM_EVENT = "local-storage-change";

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CUSTOM_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CUSTOM_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify(): void {
  window.dispatchEvent(new Event(CUSTOM_EVENT));
}

export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
}

export function useSetLocalStorage(key: string) {
  return useCallback(
    (value: string | null) => {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
      notify();
    },
    [key],
  );
}
