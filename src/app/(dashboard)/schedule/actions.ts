"use server";

import { eq, and, lte } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { assertOwnsConfig, assertOwnsScheduledMessage } from "@/lib/authz";
import { getDb } from "@/db";
import { scheduledMessage } from "@/db/schema";
import { ScheduledMessageInputSchema, UuidSchema } from "@/lib/validation";
import { z } from "zod";
import type {
  ScheduledMessageRecord,
  ScheduledMessageStatus,
  ActionResult,
} from "@/lib/stores/types";

const ScheduledStatusSchema = z.enum(["pending", "sent", "failed", "cancelled"]);

const ScheduledUpdateSchema = z.object({
  status: ScheduledStatusSchema.optional(),
  waMessageId: z.string().max(255).nullable().optional(),
  error: z.string().max(2000).nullable().optional(),
  processedAt: z.iso.datetime().nullable().optional(),
});

function mapRow(r: typeof scheduledMessage.$inferSelect): ScheduledMessageRecord {
  return {
    id: r.id,
    userId: r.userId,
    configId: r.configId,
    name: r.name ?? null,
    payload: r.payload as Record<string, unknown>,
    scheduledAt: r.scheduledAt.toISOString(),
    status: r.status as ScheduledMessageStatus,
    waMessageId: r.waMessageId ?? null,
    error: r.error ?? null,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getScheduledMessages(): Promise<ScheduledMessageRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()
    .select()
    .from(scheduledMessage)
    .where(eq(scheduledMessage.userId, userId))
    .orderBy(scheduledMessage.scheduledAt);
  return rows.map(mapRow);
}

export async function createScheduledMessage(input: unknown): Promise<ActionResult & { id?: string }> {
  try {
    const data = ScheduledMessageInputSchema.parse(input);
    const userId = await requireUserId();
    await assertOwnsConfig(data.configId, userId);

    const [row] = await getDb()
      .insert(scheduledMessage)
      .values({
        userId,
        configId: data.configId,
        name: data.name ?? null,
        payload: data.payload,
        scheduledAt: new Date(data.scheduledAt),
      })
      .returning({ id: scheduledMessage.id });

    return { success: true, id: row?.id };
  } catch (error) {
    console.error("createScheduledMessage:", error);
    return { success: false, error: "Failed to create scheduled message" };
  }
}

export async function cancelScheduledMessage(id: string): Promise<ActionResult> {
  try {
    const messageId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await assertOwnsScheduledMessage(messageId, userId);

    await getDb()
      .update(scheduledMessage)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(scheduledMessage.id, messageId),
          eq(scheduledMessage.userId, userId),
          eq(scheduledMessage.status, "pending"),
        ),
      );
    return { success: true };
  } catch (error) {
    console.error("cancelScheduledMessage:", error);
    return { success: false, error: "Failed to cancel" };
  }
}

export async function updateScheduledMessageStatus(
  id: string,
  updates: unknown,
): Promise<ActionResult> {
  try {
    const messageId = UuidSchema.parse(id);
    const data = ScheduledUpdateSchema.parse(updates);
    const userId = await requireUserId();
    await assertOwnsScheduledMessage(messageId, userId);

    await getDb()
      .update(scheduledMessage)
      .set({
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.waMessageId !== undefined ? { waMessageId: data.waMessageId } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.processedAt !== undefined
          ? { processedAt: data.processedAt ? new Date(data.processedAt) : null }
          : {}),
      })
      .where(
        and(eq(scheduledMessage.id, messageId), eq(scheduledMessage.userId, userId)),
      );
    return { success: true };
  } catch (error) {
    console.error("updateScheduledMessageStatus:", error);
    return { success: false, error: "Failed to update scheduled message" };
  }
}

// Returns this user's pending due messages. The caller (browser worker) drives
// delivery; this action exists for the future cron path too.
export async function getPendingDueMessages(): Promise<ScheduledMessageRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()
    .select()
    .from(scheduledMessage)
    .where(
      and(
        eq(scheduledMessage.userId, userId),
        eq(scheduledMessage.status, "pending"),
        lte(scheduledMessage.scheduledAt, new Date()),
      ),
    );
  return rows.map(mapRow);
}
