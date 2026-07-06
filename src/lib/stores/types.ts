// Domain types shared between local (IndexedDB) and remote (Postgres) store implementations.

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface ContactRecord {
  id: string;
  userId: string;
  configId: string | null;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  tags: string[];
  optedOut: boolean;
  optedOutAt: string | null;
  waId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInput {
  configId?: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

export interface ContactListRecord {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactListInput {
  name: string;
  description?: string;
}

export interface ContactStore {
  getContacts(configId?: string): Promise<ContactRecord[]>;
  getContact(id: string): Promise<ContactRecord | null>;
  createContact(input: ContactInput): Promise<ActionResult & { id?: string }>;
  updateContact(id: string, input: Partial<ContactInput>): Promise<ActionResult>;
  deleteContact(id: string): Promise<ActionResult>;
  deleteContacts(ids: string[]): Promise<ActionResult & { deleted: number }>;
  importContacts(
    contacts: ContactInput[],
    options?: { listId?: string },
  ): Promise<{ imported: number; skipped: number; errors: string[]; contactIds: string[] }>;
  setOptOut(id: string, optedOut: boolean): Promise<ActionResult>;
  getLists(): Promise<ContactListRecord[]>;
  createList(input: ContactListInput): Promise<ActionResult & { id?: string }>;
  deleteList(id: string): Promise<ActionResult>;
  addToList(listId: string, contactIds: string[]): Promise<ActionResult>;
  removeFromList(listId: string, contactId: string): Promise<ActionResult>;
  getListMembers(listId: string): Promise<ContactRecord[]>;
}

// ─── Media library ────────────────────────────────────────────────────────────

export type MediaKind = "image" | "video" | "audio" | "document" | "sticker";

export interface MediaAssetRecord {
  id: string;            // the Meta media id
  configId: string | null;
  filename: string;
  mimeType: string;
  kind: MediaKind;
  size: number;          // bytes
  thumbnail: string | null; // small data URL for images, else null
  createdAt: string;
}

export interface MediaAssetInput {
  id: string;
  configId?: string | null;
  filename: string;
  mimeType: string;
  kind: MediaKind;
  size: number;
  thumbnail?: string | null;
}

export interface MediaStore {
  getAssets(configId?: string): Promise<MediaAssetRecord[]>;
  addAsset(input: MediaAssetInput): Promise<ActionResult>;
  deleteAsset(id: string): Promise<ActionResult>;
}

// ─── Webhook events & received messages ──────────────────────────────────────

export interface WebhookEventRecord {
  id: string;
  configId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
}

export interface ReceivedMessageRecord {
  id: string;
  configId: string;
  waMessageId: string;
  fromPhone: string;
  fromName: string | null;
  messageType: string;
  content: Record<string, unknown>;
  status: "received" | "read" | "replied";
  timestamp: string;
  createdAt: string;
}

export interface MessageStatusRecord {
  id: string;
  configId: string;
  waMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
  recipientPhone: string | null;
  timestamp: string;
  error: Record<string, unknown> | null;
  createdAt: string;
}

export interface ConversationSummary {
  phone: string;
  name: string | null;
  lastMessage: ReceivedMessageRecord;
  unreadCount: number;
  totalMessages: number;
}

export interface InboxStore {
  getConversations(configId: string): Promise<ConversationSummary[]>;
  getMessages(configId: string, phone: string): Promise<ReceivedMessageRecord[]>;
  getWebhookEvents(configId: string, limit?: number): Promise<WebhookEventRecord[]>;
  saveWebhookEvent(event: Omit<WebhookEventRecord, "id" | "createdAt">): Promise<ActionResult>;
  saveReceivedMessage(msg: Omit<ReceivedMessageRecord, "id" | "createdAt">): Promise<ActionResult>;
  saveMessageStatus(status: Omit<MessageStatusRecord, "id" | "createdAt">): Promise<ActionResult>;
  markMessageRead(configId: string, waMessageId: string): Promise<ActionResult>;
  markThreadRead(configId: string, phone: string): Promise<ActionResult>;
  getMessageStatuses(configId: string, waMessageIds: string[]): Promise<MessageStatusRecord[]>;
  getAllMessageStatuses(configId: string): Promise<MessageStatusRecord[]>;
  getAllReceivedMessages(configId: string): Promise<ReceivedMessageRecord[]>;
}

// ─── Broadcasts ───────────────────────────────────────────────────────────────

export type BroadcastStatus = "draft" | "scheduled" | "running" | "paused" | "completed" | "failed";
export type RecipientStatus = "pending" | "sent" | "delivered" | "read" | "failed" | "skipped";

export interface BroadcastRecord {
  id: string;
  userId: string;
  configId: string | null;
  name: string;
  status: BroadcastStatus;
  messageType: string;
  payload: Record<string, unknown>;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  rateLimitMs: number;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastInput {
  configId: string;
  name: string;
  messageType: string;
  payload: Record<string, unknown>;
  recipientIds: string[];
  rateLimitMs?: number;
  scheduledAt?: string;
}

export interface BroadcastRecipientRecord {
  id: string;
  broadcastId: string;
  contactId: string | null;
  phone: string;
  name: string | null;
  status: RecipientStatus;
  waMessageId: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface BroadcastStore {
  getBroadcasts(): Promise<BroadcastRecord[]>;
  getBroadcast(id: string): Promise<BroadcastRecord | null>;
  createBroadcast(input: BroadcastInput, recipients: Array<{ phone: string; name?: string; contactId?: string }>): Promise<ActionResult & { id?: string }>;
  updateBroadcastStatus(id: string, status: BroadcastStatus, counts?: Partial<Pick<BroadcastRecord, "sentCount" | "deliveredCount" | "readCount" | "failedCount">>): Promise<ActionResult>;
  updateRecipientStatus(id: string, status: RecipientStatus, waMessageId?: string, error?: string): Promise<ActionResult>;
  getRecipients(broadcastId: string): Promise<BroadcastRecipientRecord[]>;
  deleteBroadcast(id: string): Promise<ActionResult>;
}

// ─── Scheduled messages ───────────────────────────────────────────────────────

export type ScheduledMessageStatus = "pending" | "sent" | "failed" | "cancelled";

export interface ScheduledMessageRecord {
  id: string;
  userId: string;
  configId: string;
  name: string | null;
  payload: Record<string, unknown>;
  scheduledAt: string;
  status: ScheduledMessageStatus;
  waMessageId: string | null;
  error: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface ScheduledMessageInput {
  configId: string;
  name?: string;
  payload: Record<string, unknown>;
  scheduledAt: string;
}

export interface ScheduleStore {
  getScheduledMessages(): Promise<ScheduledMessageRecord[]>;
  createScheduledMessage(input: ScheduledMessageInput): Promise<ActionResult & { id?: string }>;
  cancelScheduledMessage(id: string): Promise<ActionResult>;
  updateScheduledMessage(id: string, updates: Partial<Pick<ScheduledMessageRecord, "status" | "waMessageId" | "error" | "processedAt">>): Promise<ActionResult>;
  getPendingDue(): Promise<ScheduledMessageRecord[]>;
}

// ─── Auto-reply rules ─────────────────────────────────────────────────────────

export type TriggerType = "keyword" | "any" | "greeting" | "first_message";
export type MatchMode = "exact" | "contains" | "starts_with";
export type ResponseType = "text" | "template";

export interface AutoReplyRuleRecord {
  id: string;
  userId: string;
  configId: string;
  name: string;
  enabled: boolean;
  triggerType: TriggerType;
  keywords: string[] | null;
  matchMode: MatchMode;
  responseType: ResponseType;
  responsePayload: Record<string, unknown>;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutoReplyRuleInput {
  configId: string;
  name: string;
  triggerType: TriggerType;
  keywords?: string[];
  matchMode?: MatchMode;
  responseType: ResponseType;
  responsePayload: Record<string, unknown>;
  priority?: number;
}

export interface FlowStore {
  getRules(configId: string): Promise<AutoReplyRuleRecord[]>;
  createRule(input: AutoReplyRuleInput): Promise<ActionResult & { id?: string }>;
  updateRule(id: string, input: Partial<AutoReplyRuleInput & { enabled: boolean }>): Promise<ActionResult>;
  deleteRule(id: string): Promise<ActionResult>;
  reorderRules(ids: string[]): Promise<ActionResult>;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DailyMessageVolume {
  date: string;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  received: number;
}

export interface TemplatePerformance {
  templateName: string;
  sent: number;
  delivered: number;
  read: number;
  readRate: number;
}

export interface AnalyticsSummary {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  totalReceived: number;
  deliveryRate: number;
  readRate: number;
  dailyVolume: DailyMessageVolume[];
  topContacts: Array<{ phone: string; name: string | null; messageCount: number }>;
}
