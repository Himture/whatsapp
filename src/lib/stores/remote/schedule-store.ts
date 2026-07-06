"use client";

import {
  getScheduledMessages as serverGetScheduledMessages,
  createScheduledMessage as serverCreateScheduledMessage,
  cancelScheduledMessage as serverCancelScheduledMessage,
  updateScheduledMessageStatus as serverUpdateScheduledMessageStatus,
  getPendingDueMessages as serverGetPendingDueMessages,
} from "@/app/(dashboard)/schedule/actions";
import type {
  ScheduleStore,
  ScheduledMessageRecord,
  ScheduledMessageInput,
  ActionResult,
} from "../types";

export class RemoteScheduleStore implements ScheduleStore {
  async getScheduledMessages(): Promise<ScheduledMessageRecord[]> {
    return serverGetScheduledMessages();
  }

  async createScheduledMessage(input: ScheduledMessageInput): Promise<ActionResult & { id?: string }> {
    return serverCreateScheduledMessage(input);
  }

  async cancelScheduledMessage(id: string): Promise<ActionResult> {
    return serverCancelScheduledMessage(id);
  }

  async updateScheduledMessage(
    id: string,
    updates: Partial<Pick<ScheduledMessageRecord, "status" | "waMessageId" | "error" | "processedAt">>,
  ): Promise<ActionResult> {
    return serverUpdateScheduledMessageStatus(id, updates);
  }

  async getPendingDue(): Promise<ScheduledMessageRecord[]> {
    return serverGetPendingDueMessages();
  }
}
