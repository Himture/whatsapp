"use client";

import {
  getAutoReplyRules as serverGetAutoReplyRules,
  createAutoReplyRule as serverCreateAutoReplyRule,
  updateAutoReplyRule as serverUpdateAutoReplyRule,
  deleteAutoReplyRule as serverDeleteAutoReplyRule,
  reorderAutoReplyRules as serverReorderAutoReplyRules,
} from "@/app/(dashboard)/flows/actions";
import type {
  FlowStore,
  AutoReplyRuleRecord,
  AutoReplyRuleInput,
  ActionResult,
} from "../types";

export class RemoteFlowStore implements FlowStore {
  async getRules(configId: string): Promise<AutoReplyRuleRecord[]> {
    return serverGetAutoReplyRules(configId);
  }

  async createRule(input: AutoReplyRuleInput): Promise<ActionResult & { id?: string }> {
    return serverCreateAutoReplyRule(input);
  }

  async updateRule(id: string, input: Partial<AutoReplyRuleInput & { enabled: boolean }>): Promise<ActionResult> {
    return serverUpdateAutoReplyRule(id, input);
  }

  async deleteRule(id: string): Promise<ActionResult> {
    return serverDeleteAutoReplyRule(id);
  }

  async reorderRules(ids: string[]): Promise<ActionResult> {
    return serverReorderAutoReplyRules(ids);
  }
}
