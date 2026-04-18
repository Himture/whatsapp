"use client";

import { LocalContactStore } from "./local/contact-store";
import { LocalInboxStore } from "./local/inbox-store";
import { LocalBroadcastStore } from "./local/broadcast-store";
import { LocalScheduleStore } from "./local/schedule-store";
import { LocalFlowStore } from "./local/flow-store";

export type { ActionResult } from "./types";
export type {
  ContactRecord, ContactInput, ContactListRecord, ContactListInput, ContactStore,
} from "./types";
export type {
  WebhookEventRecord, ReceivedMessageRecord, MessageStatusRecord, ConversationSummary, InboxStore,
} from "./types";
export type {
  BroadcastRecord, BroadcastInput, BroadcastRecipientRecord,
  BroadcastStatus, RecipientStatus, BroadcastStore,
} from "./types";
export type {
  ScheduledMessageRecord, ScheduledMessageInput, ScheduledMessageStatus, ScheduleStore,
} from "./types";
export type {
  AutoReplyRuleRecord, AutoReplyRuleInput, TriggerType, MatchMode, ResponseType, FlowStore,
} from "./types";
export type { AnalyticsSummary, DailyMessageVolume, TemplatePerformance } from "./types";

// ─── Singletons ───────────────────────────────────────────────────────────────

let localContactStore: LocalContactStore | null = null;
let localInboxStore: LocalInboxStore | null = null;
let localBroadcastStore: LocalBroadcastStore | null = null;
let localScheduleStore: LocalScheduleStore | null = null;
let localFlowStore: LocalFlowStore | null = null;

// KNOWN GAP: these factories return the LOCAL IndexedDB store in *every* mode
// today — remote (cloud) implementations are not wired yet. Consequence: in
// authenticated/cloud mode the webhook receiver writes inbound data to Postgres,
// but the dashboard reads IndexedDB, so the inbox/analytics will NOT display that
// server-side data until Remote* wrappers (same pattern as RemoteStore in
// src/lib/datastore) are added here. So inbound needs both a deployed webhook
// AND these remote wrappers before the dashboard can show live traffic. The
// server actions (contacts/actions.ts etc.) are already called directly by the
// webhook receiver.

export function getContactStore(_mode: "local" | "remote"): LocalContactStore {
  if (!localContactStore) localContactStore = new LocalContactStore();
  return localContactStore;
}

export function getInboxStore(_mode: "local" | "remote"): LocalInboxStore {
  if (!localInboxStore) localInboxStore = new LocalInboxStore();
  return localInboxStore;
}

export function getBroadcastStore(_mode: "local" | "remote"): LocalBroadcastStore {
  if (!localBroadcastStore) localBroadcastStore = new LocalBroadcastStore();
  return localBroadcastStore;
}

export function getScheduleStore(_mode: "local" | "remote"): LocalScheduleStore {
  if (!localScheduleStore) localScheduleStore = new LocalScheduleStore();
  return localScheduleStore;
}

export function getFlowStore(_mode: "local" | "remote"): LocalFlowStore {
  if (!localFlowStore) localFlowStore = new LocalFlowStore();
  return localFlowStore;
}
