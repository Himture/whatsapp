import { eq, and, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { autoReplyRule } from "@/db/schema";
import type {
  AutoReplyRuleRecord,
  TriggerType,
  MatchMode,
  ResponseType,
} from "@/lib/stores/types";

const GREETINGS = ["hi", "hello", "hey", "hola", "bonjour", "salut", "namaste"];

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

// Internal helper used by the webhook receiver. Not a server action — this file has no
// "use server" directive, so it cannot be invoked from the network.
export async function findMatchingRule(
  configId: string,
  messageText: string,
  isFirstMessage: boolean,
): Promise<AutoReplyRuleRecord | null> {
  const rows = await getDb()
    .select()
    .from(autoReplyRule)
    .where(
      and(
        eq(autoReplyRule.configId, configId),
        eq(autoReplyRule.enabled, true),
      ),
    )
    .orderBy(asc(autoReplyRule.priority));

  const rules = rows.map(mapRow);
  const text = messageText.toLowerCase().trim();

  for (const rule of rules) {
    if (rule.triggerType === "any") return rule;
    if (rule.triggerType === "first_message" && isFirstMessage) return rule;
    if (rule.triggerType === "greeting" && GREETINGS.some((g) => text.includes(g))) return rule;
    if (rule.triggerType === "keyword" && rule.keywords) {
      const matched = rule.keywords.some((kw) => {
        const k = kw.toLowerCase();
        if (rule.matchMode === "exact") return text === k;
        if (rule.matchMode === "starts_with") return text.startsWith(k);
        return text.includes(k);
      });
      if (matched) return rule;
    }
  }
  return null;
}
