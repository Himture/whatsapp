"use server";

import { eq, and, desc, inArray } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { assertOwnsConfig } from "@/lib/authz";
import { getDb } from "@/db";
import {
  webhookEvent,
  receivedMessage,
  messageStatus,
} from "@/db/schema";
import { UuidSchema } from "@/lib/validation";
import { z } from "zod";
import type {
  WebhookEventRecord,
  ReceivedMessageRecord,
  MessageStatusRecord,
  ConversationSummary,
  ActionResult,
} from "@/lib/stores/types";

const PhoneSchema = z.string().min(1).max(32);
const LimitSchema = z.number().int().min(1).max(1000);
const WaMessageIdsSchema = z.array(z.string().min(1).max(255)).max(1000);

export async function getConversations(configId: string): Promise<ConversationSummary[]> {
  const cid = UuidSchema.parse(configId);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  const messages = await getDb()
    .select()
    .from(receivedMessage)
    .where(eq(receivedMessage.configId, cid))
    .orderBy(desc(receivedMessage.timestamp));

  const byPhone = new Map<string, typeof messages>();
  for (const msg of messages) {
    const bucket = byPhone.get(msg.fromPhone) ?? [];
    bucket.push(msg);
    byPhone.set(msg.fromPhone, bucket);
  }

  const summaries: ConversationSummary[] = [];
  for (const [phone, msgs] of byPhone.entries()) {
    const last = msgs[0];
    if (!last) continue;
    summaries.push({
      phone,
      name: last.fromName ?? null,
      lastMessage: {
        id: last.id,
        configId: last.configId,
        waMessageId: last.waMessageId,
        fromPhone: last.fromPhone,
        fromName: last.fromName ?? null,
        messageType: last.messageType,
        content: last.content as Record<string, unknown>,
        status: last.status as "received" | "read" | "replied",
        timestamp: last.timestamp.toISOString(),
        createdAt: last.createdAt.toISOString(),
      },
      unreadCount: msgs.filter((m) => m.status === "received").length,
      totalMessages: msgs.length,
    });
  }

  return summaries.sort(
    (a, b) =>
      new Date(b.lastMessage.timestamp).getTime() -
      new Date(a.lastMessage.timestamp).getTime(),
  );
}

export async function getMessages(configId: string, phone: string): Promise<ReceivedMessageRecord[]> {
  const cid = UuidSchema.parse(configId);
  const p = PhoneSchema.parse(phone);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  const rows = await getDb()
    .select()
    .from(receivedMessage)
    .where(and(eq(receivedMessage.configId, cid), eq(receivedMessage.fromPhone, p)))
    .orderBy(receivedMessage.timestamp);

  return rows.map((r) => ({
    id: r.id,
    configId: r.configId,
    waMessageId: r.waMessageId,
    fromPhone: r.fromPhone,
    fromName: r.fromName ?? null,
    messageType: r.messageType,
    content: r.content as Record<string, unknown>,
    status: r.status as "received" | "read" | "replied",
    timestamp: r.timestamp.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function markConversationRead(configId: string, phone: string): Promise<ActionResult> {
  try {
    const cid = UuidSchema.parse(configId);
    const p = PhoneSchema.parse(phone);
    const userId = await requireUserId();
    await assertOwnsConfig(cid, userId);

    await getDb()
      .update(receivedMessage)
      .set({ status: "read" })
      .where(
        and(
          eq(receivedMessage.configId, cid),
          eq(receivedMessage.fromPhone, p),
          eq(receivedMessage.status, "received"),
        ),
      );
    return { success: true };
  } catch (error) {
    console.error("markConversationRead:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

export async function getWebhookEvents(configId: string, limit = 100): Promise<WebhookEventRecord[]> {
  const cid = UuidSchema.parse(configId);
  const lim = LimitSchema.parse(limit);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  const rows = await getDb()
    .select()
    .from(webhookEvent)
    .where(eq(webhookEvent.configId, cid))
    .orderBy(desc(webhookEvent.createdAt))
    .limit(lim);

  return rows.map((r) => ({
    id: r.id,
    configId: r.configId,
    eventType: r.eventType,
    payload: r.payload as Record<string, unknown>,
    processedAt: r.processedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMessageStatuses(configId: string, waMessageIds: string[]): Promise<MessageStatusRecord[]> {
  const cid = UuidSchema.parse(configId);
  const ids = WaMessageIdsSchema.parse(waMessageIds);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  if (ids.length === 0) return [];

  const rows = await getDb()
    .select()
    .from(messageStatus)
    .where(
      and(
        eq(messageStatus.configId, cid),
        inArray(messageStatus.waMessageId, ids),
      ),
    );

  return rows.map((r) => ({
    id: r.id,
    configId: r.configId,
    waMessageId: r.waMessageId,
    status: r.status as "sent" | "delivered" | "read" | "failed",
    recipientPhone: r.recipientPhone ?? null,
    timestamp: r.timestamp.toISOString(),
    error: r.error as Record<string, unknown> | null,
    createdAt: r.createdAt.toISOString(),
  }));
}
