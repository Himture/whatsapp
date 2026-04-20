"use client";

import { getLocalDb } from "./db";
import type {
  InboxStore,
  WebhookEventRecord,
  ReceivedMessageRecord,
  MessageStatusRecord,
  ConversationSummary,
  ActionResult,
} from "../types";

export class LocalInboxStore implements InboxStore {
  async getConversations(configId: string): Promise<ConversationSummary[]> {
    const db = await getLocalDb();
    const messages = (await db.getAllFromIndex("receivedMessages", "configId", configId)) as ReceivedMessageRecord[];

    // Group by phone, find last message, count unread per conversation.
    const byPhone = new Map<string, ReceivedMessageRecord[]>();
    for (const msg of messages) {
      const bucket = byPhone.get(msg.fromPhone) ?? [];
      bucket.push(msg);
      byPhone.set(msg.fromPhone, bucket);
    }

    const summaries: ConversationSummary[] = [];
    for (const [phone, msgs] of byPhone.entries()) {
      const sorted = msgs.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const last = sorted[0];
      if (!last) continue;
      summaries.push({
        phone,
        name: last.fromName,
        lastMessage: last,
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

  async getMessages(configId: string, phone: string): Promise<ReceivedMessageRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAllFromIndex("receivedMessages", "configId", configId)) as ReceivedMessageRecord[];
    return all
      .filter((m) => m.fromPhone === phone)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async getWebhookEvents(configId: string, limit = 100): Promise<WebhookEventRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAllFromIndex("webhookEvents", "configId", configId)) as WebhookEventRecord[];
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async saveWebhookEvent(event: Omit<WebhookEventRecord, "id" | "createdAt">): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      await db.add("webhookEvents", {
        ...event,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save webhook event" };
    }
  }

  async saveReceivedMessage(msg: Omit<ReceivedMessageRecord, "id" | "createdAt">): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      // Deduplicate by waMessageId.
      const existing = await db.getFromIndex("receivedMessages", "waMessageId", msg.waMessageId);
      if (existing) return { success: true };
      await db.add("receivedMessages", {
        ...msg,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save message" };
    }
  }

  async saveMessageStatus(status: Omit<MessageStatusRecord, "id" | "createdAt">): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      await db.add("messageStatuses", {
        ...status,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to save status" };
    }
  }

  async markMessageRead(configId: string, waMessageId: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = await db.getFromIndex("receivedMessages", "waMessageId", waMessageId) as ReceivedMessageRecord | undefined;
      if (!existing || existing.configId !== configId) return { success: false, error: "Message not found" };
      await db.put("receivedMessages", { ...existing, status: "read" });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to mark read" };
    }
  }

  async getMessageStatuses(configId: string, waMessageIds: string[]): Promise<MessageStatusRecord[]> {
    const db = await getLocalDb();
    const results: MessageStatusRecord[] = [];
    for (const wamid of waMessageIds) {
      const statuses = await db.getAllFromIndex("messageStatuses", "waMessageId", wamid) as MessageStatusRecord[];
      results.push(...statuses.filter((s) => s.configId === configId));
    }
    return results;
  }

  async getAllMessageStatuses(configId: string): Promise<MessageStatusRecord[]> {
    const db = await getLocalDb();
    return (await db.getAllFromIndex("messageStatuses", "configId", configId)) as MessageStatusRecord[];
  }

  async getAllReceivedMessages(configId: string): Promise<ReceivedMessageRecord[]> {
    const db = await getLocalDb();
    return (await db.getAllFromIndex("receivedMessages", "configId", configId)) as ReceivedMessageRecord[];
  }
}
