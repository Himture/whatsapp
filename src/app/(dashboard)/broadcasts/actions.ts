"use server";

import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import {
  assertOwnsBroadcast,
  assertOwnsBroadcastRecipient,
  assertOwnsConfig,
} from "@/lib/authz";
import { getDb } from "@/db";
import { broadcast, broadcastRecipient, contact, whatsappConfig } from "@/db/schema";
import { BroadcastInputSchema, UuidSchema } from "@/lib/validation";
import { z } from "zod";
import type {
  BroadcastRecord,
  BroadcastRecipientRecord,
  BroadcastStatus,
  RecipientStatus,
  ActionResult,
} from "@/lib/stores/types";

const RecipientsSchema = z
  .array(
    z.object({
      phone: z.string().min(1).max(32),
      name: z.string().max(120).optional(),
      contactId: UuidSchema.optional(),
    }),
  )
  .max(100_000);

const RecipientStatusSchema = z.enum([
  "pending",
  "sent",
  "delivered",
  "read",
  "failed",
  "skipped",
]);

const BroadcastStatusSchema = z.enum(["draft", "running", "paused", "completed", "failed"]);

function mapBroadcast(r: typeof broadcast.$inferSelect): BroadcastRecord {
  return {
    id: r.id,
    userId: r.userId,
    configId: r.configId ?? null,
    name: r.name,
    status: r.status as BroadcastStatus,
    messageType: r.messageType,
    payload: r.payload as Record<string, unknown>,
    totalRecipients: r.totalRecipients,
    sentCount: r.sentCount,
    deliveredCount: r.deliveredCount,
    readCount: r.readCount,
    failedCount: r.failedCount,
    rateLimitMs: r.rateLimitMs,
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    startedAt: r.startedAt?.toISOString() ?? null,
    completedAt: r.completedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

function mapRecipient(r: typeof broadcastRecipient.$inferSelect): BroadcastRecipientRecord {
  return {
    id: r.id,
    broadcastId: r.broadcastId,
    contactId: r.contactId ?? null,
    phone: r.phone,
    name: r.name ?? null,
    status: r.status as RecipientStatus,
    waMessageId: r.waMessageId ?? null,
    error: r.error ?? null,
    sentAt: r.sentAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getBroadcasts(): Promise<BroadcastRecord[]> {
  const userId = await requireUserId();
  const rows = await getDb()
    .select()
    .from(broadcast)
    .where(eq(broadcast.userId, userId))
    .orderBy(broadcast.createdAt);
  return rows.map(mapBroadcast).reverse();
}

export async function getBroadcast(id: string): Promise<BroadcastRecord | null> {
  const broadcastId = UuidSchema.parse(id);
  const userId = await requireUserId();
  const [row] = await getDb()
    .select()
    .from(broadcast)
    .where(and(eq(broadcast.id, broadcastId), eq(broadcast.userId, userId)));
  return row ? mapBroadcast(row) : null;
}

export async function createBroadcast(
  input: unknown,
  recipients: unknown,
): Promise<ActionResult & { id?: string }> {
  try {
    const data = BroadcastInputSchema.parse(input);
    const recipientList = RecipientsSchema.parse(recipients);
    const userId = await requireUserId();
    await assertOwnsConfig(data.configId, userId);

    const [row] = await getDb()
      .insert(broadcast)
      .values({
        userId,
        configId: data.configId,
        name: data.name,
        status: "draft",
        messageType: data.messageType,
        payload: data.payload,
        totalRecipients: recipientList.length,
        rateLimitMs: data.rateLimitMs ?? 100,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      })
      .returning({ id: broadcast.id });

    if (!row) return { success: false, error: "Failed to create broadcast" };

    if (recipientList.length > 0) {
      await getDb().insert(broadcastRecipient).values(
        recipientList.map((r) => ({
          broadcastId: row.id,
          contactId: r.contactId ?? null,
          phone: r.phone,
          name: r.name ?? null,
          status: "pending" as const,
        })),
      );
    }

    return { success: true, id: row.id };
  } catch (error) {
    console.error("createBroadcast:", error);
    return { success: false, error: "Failed to create broadcast" };
  }
}

export async function updateBroadcastStatus(
  id: string,
  status: BroadcastStatus,
  counts?: Partial<Pick<BroadcastRecord, "sentCount" | "deliveredCount" | "readCount" | "failedCount">>,
): Promise<ActionResult> {
  try {
    const broadcastId = UuidSchema.parse(id);
    const newStatus = BroadcastStatusSchema.parse(status);
    const userId = await requireUserId();
    await assertOwnsBroadcast(broadcastId, userId);

    const now = new Date();
    await getDb()
      .update(broadcast)
      .set({
        status: newStatus,
        ...counts,
        startedAt: newStatus === "running" ? now : undefined,
        completedAt: newStatus === "completed" || newStatus === "failed" ? now : undefined,
        updatedAt: now,
      })
      .where(and(eq(broadcast.id, broadcastId), eq(broadcast.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("updateBroadcastStatus:", error);
    return { success: false, error: "Failed to update broadcast status" };
  }
}

export async function updateRecipientStatus(
  id: string,
  status: RecipientStatus,
  waMessageId?: string,
  error?: string,
): Promise<ActionResult> {
  try {
    const recipientId = UuidSchema.parse(id);
    const newStatus = RecipientStatusSchema.parse(status);
    const userId = await requireUserId();
    await assertOwnsBroadcastRecipient(recipientId, userId);

    await getDb()
      .update(broadcastRecipient)
      .set({
        status: newStatus,
        waMessageId: waMessageId ?? null,
        error: error ?? null,
        sentAt: newStatus === "sent" ? new Date() : undefined,
      })
      .where(eq(broadcastRecipient.id, recipientId));
    return { success: true };
  } catch (err) {
    console.error("updateRecipientStatus:", err);
    return { success: false, error: "Failed to update recipient status" };
  }
}

export async function getRecipients(broadcastId: string): Promise<BroadcastRecipientRecord[]> {
  const id = UuidSchema.parse(broadcastId);
  const userId = await requireUserId();
  await assertOwnsBroadcast(id, userId);

  const rows = await getDb()
    .select()
    .from(broadcastRecipient)
    .where(eq(broadcastRecipient.broadcastId, id));
  return rows.map(mapRecipient);
}

export async function deleteBroadcast(id: string): Promise<ActionResult> {
  try {
    const broadcastId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await getDb()
      .delete(broadcast)
      .where(and(eq(broadcast.id, broadcastId), eq(broadcast.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("deleteBroadcast:", error);
    return { success: false, error: "Failed to delete broadcast" };
  }
}

export async function getBroadcastContactOptions(configId: string): Promise<Array<{ id: string; name: string; phone: string }>> {
  const cid = UuidSchema.parse(configId);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  const rows = await getDb()
    .select({ id: contact.id, name: contact.name, phone: contact.phone })
    .from(contact)
    .innerJoin(whatsappConfig, eq(contact.configId, whatsappConfig.id))
    .where(
      and(
        eq(contact.userId, userId),
        eq(contact.optedOut, false),
        eq(contact.configId, cid),
        eq(whatsappConfig.userId, userId),
      ),
    )
    .orderBy(contact.name);
  return rows;
}
