"use client";

import { getLocalDb } from "./db";
import type { MediaStore, MediaAssetRecord, MediaAssetInput, ActionResult } from "../types";

// Client-side log of media uploaded through the app. There is no "list media"
// Graph endpoint, so this local index is the only way the library and pickers
// know what has been uploaded. It's a convenience cache — Meta media ids are
// ephemeral (~30 days), so stale entries are expected and harmless.
export class LocalMediaStore implements MediaStore {
  async getAssets(configId?: string): Promise<MediaAssetRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAll("mediaAssets")) as MediaAssetRecord[];
    const filtered = configId ? all.filter((a) => a.configId === configId || a.configId === null) : all;
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async addAsset(input: MediaAssetInput): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const record: MediaAssetRecord = {
        id: input.id,
        configId: input.configId ?? null,
        filename: input.filename,
        mimeType: input.mimeType,
        kind: input.kind,
        size: input.size,
        thumbnail: input.thumbnail ?? null,
        createdAt: new Date().toISOString(),
      };
      await db.put("mediaAssets", record);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save media asset" };
    }
  }

  async deleteAsset(id: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      await db.delete("mediaAssets", id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete media asset" };
    }
  }
}
