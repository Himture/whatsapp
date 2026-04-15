"use client";

import { getLocalDb } from "./db";
import type {
  ScheduleStore,
  ScheduledMessageRecord,
  ScheduledMessageInput,
  ActionResult,
} from "../types";

const LOCAL_USER_ID = "local";

export class LocalScheduleStore implements ScheduleStore {
  async getScheduledMessages(): Promise<ScheduledMessageRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAll("scheduledMessages")) as ScheduledMessageRecord[];
    return all.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }

  async createScheduledMessage(input: ScheduledMessageInput): Promise<ActionResult & { id?: string }> {
    try {
      const db = await getLocalDb();
      const record: ScheduledMessageRecord = {
        id: crypto.randomUUID(),
        userId: LOCAL_USER_ID,
        configId: input.configId,
        name: input.name ?? null,
        payload: input.payload,
        scheduledAt: input.scheduledAt,
        status: "pending",
        waMessageId: null,
        error: null,
        processedAt: null,
        createdAt: new Date().toISOString(),
      };
      await db.add("scheduledMessages", record);
      return { success: true, id: record.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create scheduled message" };
    }
  }

  async cancelScheduledMessage(id: string): Promise<ActionResult> {
    return this.updateScheduledMessage(id, { status: "cancelled" });
  }

  async updateScheduledMessage(
    id: string,
    updates: Partial<Pick<ScheduledMessageRecord, "status" | "waMessageId" | "error" | "processedAt">>,
  ): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("scheduledMessages", id)) as ScheduledMessageRecord | undefined;
      if (!existing) return { success: false, error: "Scheduled message not found" };
      await db.put("scheduledMessages", { ...existing, ...updates });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update scheduled message" };
    }
  }

  async getPendingDue(): Promise<ScheduledMessageRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAllFromIndex("scheduledMessages", "status", "pending")) as ScheduledMessageRecord[];
    const now = new Date();
    return all.filter((m) => new Date(m.scheduledAt) <= now);
  }
}
