"use client";

import type { DataStore, ConfigRecord, SyncResult } from "./types";

export async function syncAll(
  local: DataStore,
  remote: DataStore,
): Promise<SyncResult> {
  const result: SyncResult = {
    pushed: 0,
    pulled: 0,
    conflicts: 0,
    errors: [],
  };

  let localConfigs: ConfigRecord[];
  let remoteConfigs: ConfigRecord[];

  try {
    localConfigs = await local.getConfigs();
  } catch {
    result.errors.push("Failed to read local configs");
    return result;
  }

  try {
    remoteConfigs = await remote.getConfigs();
  } catch {
    result.errors.push("Failed to read remote configs");
    return result;
  }

  const localMap = new Map(localConfigs.map((c) => [c.id, c]));
  const remoteMap = new Map(remoteConfigs.map((c) => [c.id, c]));

  for (const [id, localConfig] of localMap) {
    if (!remoteMap.has(id)) {
      try {
        const pushResult = await remote.createConfig({
          name: localConfig.name,
          accessToken: localConfig.accessToken,
          phoneNumberId: localConfig.phoneNumberId,
          wabaId: localConfig.wabaId,
          businessPortfolioId: localConfig.businessPortfolioId ?? undefined,
          apiVersion: localConfig.apiVersion as "v21.0" | "v20.0" | "v19.0" | "v18.0",
        });
        if (pushResult.success) {
          result.pushed++;
        } else {
          result.errors.push(`Push failed for "${localConfig.name}": ${pushResult.error ?? "Unknown"}`);
        }
      } catch {
        result.errors.push(`Push failed for "${localConfig.name}"`);
      }
    }
  }

  for (const [id, remoteConfig] of remoteMap) {
    if (!localMap.has(id)) {
      try {
        const pullResult = await local.createConfig({
          name: remoteConfig.name,
          accessToken: remoteConfig.accessToken,
          phoneNumberId: remoteConfig.phoneNumberId,
          wabaId: remoteConfig.wabaId,
          businessPortfolioId: remoteConfig.businessPortfolioId ?? undefined,
          apiVersion: remoteConfig.apiVersion as "v21.0" | "v20.0" | "v19.0" | "v18.0",
        });
        if (pullResult.success) {
          result.pulled++;
        } else {
          result.errors.push(`Pull failed for "${remoteConfig.name}": ${pullResult.error ?? "Unknown"}`);
        }
      } catch {
        result.errors.push(`Pull failed for "${remoteConfig.name}"`);
      }
    }
  }

  // Resolve conflicts (both exist) — last-write-wins
  for (const [id, localConfig] of localMap) {
    const remoteConfig = remoteMap.get(id);
    if (!remoteConfig) continue;

    const localTime = new Date(localConfig.updatedAt).getTime();
    const remoteTime = new Date(remoteConfig.updatedAt).getTime();

    if (localTime === remoteTime) continue;

    result.conflicts++;

    if (localTime > remoteTime) {
      try {
        await remote.updateConfig(id, {
          name: localConfig.name,
          accessToken: localConfig.accessToken,
          phoneNumberId: localConfig.phoneNumberId,
          wabaId: localConfig.wabaId,
          businessPortfolioId: localConfig.businessPortfolioId ?? undefined,
          apiVersion: localConfig.apiVersion as "v21.0" | "v20.0" | "v19.0" | "v18.0",
        });
        result.pushed++;
      } catch {
        result.errors.push(`Sync conflict push failed for "${localConfig.name}"`);
      }
    } else {
      try {
        await local.updateConfig(id, {
          name: remoteConfig.name,
          accessToken: remoteConfig.accessToken,
          phoneNumberId: remoteConfig.phoneNumberId,
          wabaId: remoteConfig.wabaId,
          businessPortfolioId: remoteConfig.businessPortfolioId ?? undefined,
          apiVersion: remoteConfig.apiVersion as "v21.0" | "v20.0" | "v19.0" | "v18.0",
        });
        result.pulled++;
      } catch {
        result.errors.push(`Sync conflict pull failed for "${remoteConfig.name}"`);
      }
    }
  }

  return result;
}
