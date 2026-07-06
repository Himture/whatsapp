"use client";

import {
  getBroadcasts as serverGetBroadcasts,
  getBroadcast as serverGetBroadcast,
  createBroadcast as serverCreateBroadcast,
  updateBroadcastStatus as serverUpdateBroadcastStatus,
  updateRecipientStatus as serverUpdateRecipientStatus,
  getRecipients as serverGetRecipients,
  deleteBroadcast as serverDeleteBroadcast,
} from "@/app/(dashboard)/broadcasts/actions";
import type {
  BroadcastStore,
  BroadcastRecord,
  BroadcastInput,
  BroadcastRecipientRecord,
  BroadcastStatus,
  RecipientStatus,
  ActionResult,
} from "../types";

export class RemoteBroadcastStore implements BroadcastStore {
  async getBroadcasts(): Promise<BroadcastRecord[]> {
    return serverGetBroadcasts();
  }

  async getBroadcast(id: string): Promise<BroadcastRecord | null> {
    return serverGetBroadcast(id);
  }

  async createBroadcast(
    input: BroadcastInput,
    recipients: Array<{ phone: string; name?: string; contactId?: string }>,
  ): Promise<ActionResult & { id?: string }> {
    return serverCreateBroadcast(input, recipients);
  }

  async updateBroadcastStatus(
    id: string,
    status: BroadcastStatus,
    counts?: Partial<Pick<BroadcastRecord, "sentCount" | "deliveredCount" | "readCount" | "failedCount">>,
  ): Promise<ActionResult> {
    return serverUpdateBroadcastStatus(id, status, counts);
  }

  async updateRecipientStatus(
    id: string,
    status: RecipientStatus,
    waMessageId?: string,
    error?: string,
  ): Promise<ActionResult> {
    return serverUpdateRecipientStatus(id, status, waMessageId, error);
  }

  async getRecipients(broadcastId: string): Promise<BroadcastRecipientRecord[]> {
    return serverGetRecipients(broadcastId);
  }

  async deleteBroadcast(id: string): Promise<ActionResult> {
    return serverDeleteBroadcast(id);
  }
}
