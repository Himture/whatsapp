"use client";

import { LocalStore } from "./local-store";
import { RemoteStore } from "./remote-store";
import type { DataStore } from "./types";

export type { DataStore, ConfigRecord, ConfigInput, ActionResult } from "./types";
export { LocalStore } from "./local-store";
export { RemoteStore } from "./remote-store";

let localStoreInstance: LocalStore | null = null;
let remoteStoreInstance: RemoteStore | null = null;

export function getDataStore(mode: "local" | "remote"): DataStore {
  if (mode === "local") {
    if (!localStoreInstance) {
      localStoreInstance = new LocalStore();
    }
    return localStoreInstance;
  }

  if (!remoteStoreInstance) {
    remoteStoreInstance = new RemoteStore();
  }
  return remoteStoreInstance;
}
