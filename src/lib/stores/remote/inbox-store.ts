"use client";

import {
  getConversations as serverGetConversations,
  getMessages as serverGetMessages,
  getWebhookEvents as serverGetWebhookEvents,
  getMessageStatuses as serverGetMessageStatuses,
  getAllMessageStatuses as serverGetAllMessageStatuses,
  getAllReceivedMessages as serverGetAllReceivedMessages,
  markConversationRead as serverMarkConversationRead,
} from "@/app/(dashboard)/inbox/actions";
import type {
  InboxStore,
  WebhookEventRecord,
  ReceivedMessageRecord,
  MessageStatusRecord,
  ConversationSummary,
  ActionResult,
} from "../types";

export class RemoteInboxStore implements InboxStore {
  async getConversations(configId: string): Promise<ConversationSummary[]> {
    return serverGetConversations(configId);
  }

  async getMessages(configId: string, phone: string): Promise<ReceivedMessageRecord[]> {
    return serverGetMessages(configId, phone);
  }

  async getWebhookEvents(configId: string, limit = 100): Promise<WebhookEventRecord[]> {
    return serverGetWebhookEvents(configId, limit);
  }

  // Inbound data (webhook events, received messages, status receipts) is written
  // server-side by the webhook route, never from the dashboard. No-op here.
  async saveWebhookEvent(_event: Omit<WebhookEventRecord, "id" | "createdAt">): Promise<ActionResult> {
    return { success: true };
  }

  async saveReceivedMessage(_msg: Omit<ReceivedMessageRecord, "id" | "createdAt">): Promise<ActionResult> {
    return { success: true };
  }

  async saveMessageStatus(_status: Omit<MessageStatusRecord, "id" | "createdAt">): Promise<ActionResult> {
    return { success: true };
  }

  // Nothing in the dashboard calls markMessageRead (single-message) in remote mode;
  // there's no server action keyed by waMessageId, so this is a no-op success.
  async markMessageRead(_configId: string, _waMessageId: string): Promise<ActionResult> {
    return { success: true };
  }

  async markThreadRead(configId: string, phone: string): Promise<ActionResult> {
    return serverMarkConversationRead(configId, phone);
  }

  async getMessageStatuses(configId: string, waMessageIds: string[]): Promise<MessageStatusRecord[]> {
    return serverGetMessageStatuses(configId, waMessageIds);
  }

  async getAllMessageStatuses(configId: string): Promise<MessageStatusRecord[]> {
    return serverGetAllMessageStatuses(configId);
  }

  async getAllReceivedMessages(configId: string): Promise<ReceivedMessageRecord[]> {
    return serverGetAllReceivedMessages(configId);
  }
}
