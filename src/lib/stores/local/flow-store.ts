"use client";

import { getLocalDb } from "./db";
import type {
  FlowStore,
  AutoReplyRuleRecord,
  AutoReplyRuleInput,
  ActionResult,
} from "../types";

const LOCAL_USER_ID = "local";

export class LocalFlowStore implements FlowStore {
  async getRules(configId: string): Promise<AutoReplyRuleRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAllFromIndex("autoReplyRules", "configId", configId)) as AutoReplyRuleRecord[];
    return all.sort((a, b) => a.priority - b.priority);
  }

  async createRule(input: AutoReplyRuleInput): Promise<ActionResult & { id?: string }> {
    try {
      const db = await getLocalDb();
      const now = new Date().toISOString();
      const record: AutoReplyRuleRecord = {
        id: crypto.randomUUID(),
        userId: LOCAL_USER_ID,
        configId: input.configId,
        name: input.name,
        enabled: true,
        triggerType: input.triggerType,
        keywords: input.keywords ?? null,
        matchMode: input.matchMode ?? "contains",
        responseType: input.responseType,
        responsePayload: input.responsePayload,
        priority: input.priority ?? 0,
        createdAt: now,
        updatedAt: now,
      };
      await db.add("autoReplyRules", record);
      return { success: true, id: record.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create rule" };
    }
  }

  async updateRule(
    id: string,
    input: Partial<AutoReplyRuleInput & { enabled: boolean }>,
  ): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("autoReplyRules", id)) as AutoReplyRuleRecord | undefined;
      if (!existing) return { success: false, error: "Rule not found" };

      await db.put("autoReplyRules", {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update rule" };
    }
  }

  async deleteRule(id: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      await db.delete("autoReplyRules", id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete rule" };
    }
  }

  async reorderRules(ids: string[]): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const tx = db.transaction("autoReplyRules", "readwrite");
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        if (!id) continue;
        const rule = (await tx.store.get(id)) as AutoReplyRuleRecord | undefined;
        if (rule) {
          await tx.store.put({ ...rule, priority: i, updatedAt: new Date().toISOString() });
        }
      }
      await tx.done;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to reorder rules" };
    }
  }
}
