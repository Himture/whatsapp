"use client";

import { openDB, type IDBPDatabase } from "idb";
import { encryptValue, decryptValue } from "@/lib/crypto";
import type { DataStore, ConfigRecord, ConfigInput, ActionResult } from "./types";

const DB_NAME = "whatsapp-api-manager";
const DB_VERSION = 1;
const STORE_NAME = "configs";

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("isDefault", "isDefault");
      }
    },
  });
}

interface StoredConfig {
  id: string;
  name: string;
  encryptedAccessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId: string | null;
  apiVersion: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

async function storedToRecord(stored: StoredConfig): Promise<ConfigRecord> {
  const accessToken = await decryptValue(stored.encryptedAccessToken);
  return {
    id: stored.id,
    name: stored.name,
    accessToken,
    phoneNumberId: stored.phoneNumberId,
    wabaId: stored.wabaId,
    businessPortfolioId: stored.businessPortfolioId,
    apiVersion: stored.apiVersion,
    isDefault: stored.isDefault,
    createdAt: stored.createdAt,
    updatedAt: stored.updatedAt,
  };
}

export class LocalStore implements DataStore {
  async getConfigs(): Promise<ConfigRecord[]> {
    const db = await getDb();
    const stored = (await db.getAll(STORE_NAME)) as StoredConfig[];
    const records = await Promise.all(stored.map(storedToRecord));
    return records.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async createConfig(input: ConfigInput): Promise<ActionResult> {
    try {
      const db = await getDb();
      const allConfigs = (await db.getAll(STORE_NAME)) as StoredConfig[];
      const isFirst = allConfigs.length === 0;
      const now = new Date().toISOString();

      const stored: StoredConfig = {
        id: crypto.randomUUID(),
        name: input.name,
        encryptedAccessToken: await encryptValue(input.accessToken),
        phoneNumberId: input.phoneNumberId,
        wabaId: input.wabaId,
        businessPortfolioId: input.businessPortfolioId ?? null,
        apiVersion: input.apiVersion,
        isDefault: isFirst,
        createdAt: now,
        updatedAt: now,
      };

      await db.add(STORE_NAME, stored);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create config",
      };
    }
  }

  async updateConfig(configId: string, input: Partial<ConfigInput>): Promise<ActionResult> {
    try {
      const db = await getDb();
      const existing = (await db.get(STORE_NAME, configId)) as StoredConfig | undefined;
      if (!existing) {
        return { success: false, error: "Config not found" };
      }

      const updated: StoredConfig = {
        ...existing,
        updatedAt: new Date().toISOString(),
      };

      if (input.name !== undefined) updated.name = input.name;
      if (input.accessToken !== undefined) {
        updated.encryptedAccessToken = await encryptValue(input.accessToken);
      }
      if (input.phoneNumberId !== undefined) updated.phoneNumberId = input.phoneNumberId;
      if (input.wabaId !== undefined) updated.wabaId = input.wabaId;
      if (input.businessPortfolioId !== undefined) {
        updated.businessPortfolioId = input.businessPortfolioId ?? null;
      }
      if (input.apiVersion !== undefined) updated.apiVersion = input.apiVersion;

      await db.put(STORE_NAME, updated);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update config",
      };
    }
  }

  async deleteConfig(configId: string): Promise<ActionResult> {
    try {
      const db = await getDb();
      await db.delete(STORE_NAME, configId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete config",
      };
    }
  }

  async setDefaultConfig(configId: string): Promise<ActionResult> {
    try {
      const db = await getDb();
      const allConfigs = (await db.getAll(STORE_NAME)) as StoredConfig[];

      const tx = db.transaction(STORE_NAME, "readwrite");
      for (const config of allConfigs) {
        const shouldBeDefault = config.id === configId;
        if (config.isDefault !== shouldBeDefault) {
          await tx.store.put({
            ...config,
            isDefault: shouldBeDefault,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      await tx.done;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to set default config",
      };
    }
  }
}
