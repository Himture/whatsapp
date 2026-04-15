"use client";

import { getLocalDb } from "./db";
import type {
  BroadcastStore,
  BroadcastRecord,
  BroadcastInput,
  BroadcastRecipientRecord,
  BroadcastStatus,
  RecipientStatus,
  ActionResult,
} from "../types";

const LOCAL_USER_ID = "local";

export class LocalBroadcastStore implements BroadcastStore {
  async getBroadcasts(): Promise<BroadcastRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAll("broadcasts")) as BroadcastRecord[];
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getBroadcast(id: string): Promise<BroadcastRecord | null> {
    const db = await getLocalDb();
    return ((await db.get("broadcasts", id)) as BroadcastRecord | undefined) ?? null;
  }

  async createBroadcast(
    input: BroadcastInput,
    recipients: Array<{ phone: string; name?: string; contactId?: string }>,
  ): Promise<ActionResult & { id?: string }> {
    try {
      const db = await getLocalDb();
      const now = new Date().toISOString();
      const broadcastId = crypto.randomUUID();

      const record: BroadcastRecord = {
        id: broadcastId,
        userId: LOCAL_USER_ID,
        configId: input.configId,
        name: input.name,
        status: input.scheduledAt ? "draft" : "draft",
        messageType: input.messageType,
        payload: input.payload,
        totalRecipients: recipients.length,
        sentCount: 0,
        deliveredCount: 0,
        readCount: 0,
        failedCount: 0,
        rateLimitMs: input.rateLimitMs ?? 100,
        scheduledAt: input.scheduledAt ?? null,
        startedAt: null,
        completedAt: null,
        createdAt: now,
        updatedAt: now,
      };

      await db.add("broadcasts", record);

      const tx = db.transaction("broadcastRecipients", "readwrite");
      for (const r of recipients) {
        await tx.store.add({
          id: crypto.randomUUID(),
          broadcastId,
          contactId: r.contactId ?? null,
          phone: r.phone,
          name: r.name ?? null,
          status: "pending" as RecipientStatus,
          waMessageId: null,
          error: null,
          sentAt: null,
          createdAt: now,
        } as BroadcastRecipientRecord);
      }
      await tx.done;

      return { success: true, id: broadcastId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create broadcast" };
    }
  }

  async updateBroadcastStatus(
    id: string,
    status: BroadcastStatus,
    counts?: Partial<Pick<BroadcastRecord, "sentCount" | "deliveredCount" | "readCount" | "failedCount">>,
  ): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("broadcasts", id)) as BroadcastRecord | undefined;
      if (!existing) return { success: false, error: "Broadcast not found" };

      const now = new Date().toISOString();
      await db.put("broadcasts", {
        ...existing,
        status,
        ...counts,
        startedAt: status === "running" && !existing.startedAt ? now : existing.startedAt,
        completedAt: (status === "completed" || status === "failed") ? now : existing.completedAt,
        updatedAt: now,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update broadcast" };
    }
  }

  async updateRecipientStatus(
    id: string,
    status: RecipientStatus,
    waMessageId?: string,
    error?: string,
  ): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("broadcastRecipients", id)) as BroadcastRecipientRecord | undefined;
      if (!existing) return { success: false, error: "Recipient not found" };

      await db.put("broadcastRecipients", {
        ...existing,
        status,
        waMessageId: waMessageId ?? existing.waMessageId,
        error: error ?? existing.error,
        sentAt: status === "sent" ? new Date().toISOString() : existing.sentAt,
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update recipient" };
    }
  }

  async getRecipients(broadcastId: string): Promise<BroadcastRecipientRecord[]> {
    const db = await getLocalDb();
    return (await db.getAllFromIndex("broadcastRecipients", "broadcastId", broadcastId)) as BroadcastRecipientRecord[];
  }

  async deleteBroadcast(id: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const tx = db.transaction(["broadcasts", "broadcastRecipients"], "readwrite");
      await tx.objectStore("broadcasts").delete(id);
      const recipients = await tx.objectStore("broadcastRecipients").index("broadcastId").getAll(id) as BroadcastRecipientRecord[];
      for (const r of recipients) {
        await tx.objectStore("broadcastRecipients").delete(r.id);
      }
      await tx.done;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete broadcast" };
    }
  }
}
