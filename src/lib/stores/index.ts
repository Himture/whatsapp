"use client";

import { LocalContactStore } from "./local/contact-store";
import { LocalInboxStore } from "./local/inbox-store";
import { LocalBroadcastStore } from "./local/broadcast-store";
import { LocalScheduleStore } from "./local/schedule-store";
import { LocalFlowStore } from "./local/flow-store";
import { LocalMediaStore } from "./local/media-store";
import { RemoteContactStore } from "./remote/contact-store";
import { RemoteInboxStore } from "./remote/inbox-store";
import { RemoteBroadcastStore } from "./remote/broadcast-store";
import { RemoteScheduleStore } from "./remote/schedule-store";
import { RemoteFlowStore } from "./remote/flow-store";
import type {
  ContactStore,
  InboxStore,
  BroadcastStore,
  ScheduleStore,
  FlowStore,
  MediaStore,
} from "./types";

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
export type { MediaAssetRecord, MediaAssetInput, MediaKind, MediaStore } from "./types";

// ─── Singletons ───────────────────────────────────────────────────────────────

let localContactStore: LocalContactStore | null = null;
let localInboxStore: LocalInboxStore | null = null;
let localBroadcastStore: LocalBroadcastStore | null = null;
let localScheduleStore: LocalScheduleStore | null = null;
let localFlowStore: LocalFlowStore | null = null;

let remoteContactStore: RemoteContactStore | null = null;
let remoteInboxStore: RemoteInboxStore | null = null;
let remoteBroadcastStore: RemoteBroadcastStore | null = null;
let remoteScheduleStore: RemoteScheduleStore | null = null;
let remoteFlowStore: RemoteFlowStore | null = null;

// Each getter returns the Postgres-backed Remote* wrapper when authenticated
// (mode === "remote"), else the local IndexedDB store. Both satisfy the shared
// interface, so callers are agnostic to which one they get.

export function getContactStore(mode: "local" | "remote"): ContactStore {
  if (mode === "remote") {
    if (!remoteContactStore) remoteContactStore = new RemoteContactStore();
    return remoteContactStore;
  }
  if (!localContactStore) localContactStore = new LocalContactStore();
  return localContactStore;
}

export function getInboxStore(mode: "local" | "remote"): InboxStore {
  if (mode === "remote") {
    if (!remoteInboxStore) remoteInboxStore = new RemoteInboxStore();
    return remoteInboxStore;
  }
  if (!localInboxStore) localInboxStore = new LocalInboxStore();
  return localInboxStore;
}

export function getBroadcastStore(mode: "local" | "remote"): BroadcastStore {
  if (mode === "remote") {
    if (!remoteBroadcastStore) remoteBroadcastStore = new RemoteBroadcastStore();
    return remoteBroadcastStore;
  }
  if (!localBroadcastStore) localBroadcastStore = new LocalBroadcastStore();
  return localBroadcastStore;
}

export function getScheduleStore(mode: "local" | "remote"): ScheduleStore {
  if (mode === "remote") {
    if (!remoteScheduleStore) remoteScheduleStore = new RemoteScheduleStore();
    return remoteScheduleStore;
  }
  if (!localScheduleStore) localScheduleStore = new LocalScheduleStore();
  return localScheduleStore;
}

export function getFlowStore(mode: "local" | "remote"): FlowStore {
  if (mode === "remote") {
    if (!remoteFlowStore) remoteFlowStore = new RemoteFlowStore();
    return remoteFlowStore;
  }
  if (!localFlowStore) localFlowStore = new LocalFlowStore();
  return localFlowStore;
}

// The media library is a client-side log of uploads (Meta has no list-media
// endpoint), so it's always local regardless of session mode.
let localMediaStore: LocalMediaStore | null = null;
export function getMediaStore(): MediaStore {
  if (!localMediaStore) localMediaStore = new LocalMediaStore();
  return localMediaStore;
}
