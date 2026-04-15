"use server";

import { eq, and, asc } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { assertOwnsAutoReplyRule, assertOwnsConfig } from "@/lib/authz";
import { getDb } from "@/db";
import { autoReplyRule } from "@/db/schema";
import { AutoReplyRuleInputSchema, UuidSchema } from "@/lib/validation";
import { z } from "zod";
import type {
  AutoReplyRuleRecord,
  TriggerType,
  MatchMode,
  ResponseType,
  ActionResult,
} from "@/lib/stores/types";

const RuleUpdateSchema = AutoReplyRuleInputSchema.partial().extend({
  enabled: z.boolean().optional(),
});

const ReorderSchema = z.array(UuidSchema).max(1000);

function mapRow(r: typeof autoReplyRule.$inferSelect): AutoReplyRuleRecord {
  return {
    id: r.id,
    userId: r.userId,
    configId: r.configId,
    name: r.name,
    enabled: r.enabled,
    triggerType: r.triggerType as TriggerType,
    keywords: r.keywords ?? null,
    matchMode: r.matchMode as MatchMode,
    responseType: r.responseType as ResponseType,
    responsePayload: r.responsePayload as Record<string, unknown>,
    priority: r.priority,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getAutoReplyRules(configId: string): Promise<AutoReplyRuleRecord[]> {
  const cid = UuidSchema.parse(configId);
  const userId = await requireUserId();
  await assertOwnsConfig(cid, userId);

  const rows = await getDb()
    .select()
    .from(autoReplyRule)
    .where(and(eq(autoReplyRule.configId, cid), eq(autoReplyRule.userId, userId)))
    .orderBy(asc(autoReplyRule.priority));
  return rows.map(mapRow);
}

export async function createAutoReplyRule(input: unknown): Promise<ActionResult & { id?: string }> {
  try {
    const data = AutoReplyRuleInputSchema.parse(input);
    const userId = await requireUserId();
    await assertOwnsConfig(data.configId, userId);

    const [row] = await getDb()
      .insert(autoReplyRule)
      .values({
        userId,
        configId: data.configId,
        name: data.name,
        triggerType: data.triggerType,
        keywords: data.keywords ?? null,
        matchMode: data.matchMode ?? "contains",
        responseType: data.responseType,
        responsePayload: data.responsePayload,
        priority: data.priority ?? 0,
      })
      .returning({ id: autoReplyRule.id });

    return { success: true, id: row?.id };
  } catch (error) {
    console.error("createAutoReplyRule:", error);
    return { success: false, error: "Failed to create rule" };
  }
}

export async function updateAutoReplyRule(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const ruleId = UuidSchema.parse(id);
    const data = RuleUpdateSchema.parse(input);
    const userId = await requireUserId();
    await assertOwnsAutoReplyRule(ruleId, userId);

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) values.name = data.name;
    if (data.enabled !== undefined) values.enabled = data.enabled;
    if (data.triggerType !== undefined) values.triggerType = data.triggerType;
    if (data.keywords !== undefined) values.keywords = data.keywords ?? null;
    if (data.matchMode !== undefined) values.matchMode = data.matchMode;
    if (data.responseType !== undefined) values.responseType = data.responseType;
    if (data.responsePayload !== undefined) values.responsePayload = data.responsePayload;
    if (data.priority !== undefined) values.priority = data.priority;

    await getDb()
      .update(autoReplyRule)
      .set(values)
      .where(and(eq(autoReplyRule.id, ruleId), eq(autoReplyRule.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("updateAutoReplyRule:", error);
    return { success: false, error: "Failed to update rule" };
  }
}

export async function deleteAutoReplyRule(id: string): Promise<ActionResult> {
  try {
    const ruleId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await assertOwnsAutoReplyRule(ruleId, userId);

    await getDb()
      .delete(autoReplyRule)
      .where(and(eq(autoReplyRule.id, ruleId), eq(autoReplyRule.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("deleteAutoReplyRule:", error);
    return { success: false, error: "Failed to delete rule" };
  }
}

export async function reorderAutoReplyRules(ids: unknown): Promise<ActionResult> {
  try {
    const list = ReorderSchema.parse(ids);
    const userId = await requireUserId();
    for (let i = 0; i < list.length; i++) {
      const id = list[i];
      if (!id) continue;
      await getDb()
        .update(autoReplyRule)
        .set({ priority: i, updatedAt: new Date() })
        .where(and(eq(autoReplyRule.id, id), eq(autoReplyRule.userId, userId)));
    }
    return { success: true };
  } catch (error) {
    console.error("reorderAutoReplyRules:", error);
    return { success: false, error: "Failed to reorder rules" };
  }
}
