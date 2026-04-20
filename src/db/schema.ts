import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// ─── Auth tables (Better Auth) ───────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── WhatsApp configuration ───────────────────────────────────────────────────

export const whatsappConfig = pgTable("whatsapp_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  accessToken: text("access_token").notNull(),
  phoneNumberId: text("phone_number_id").notNull(),
  wabaId: text("waba_id").notNull(),
  businessPortfolioId: text("business_portfolio_id"),
  // Keep in sync with DEFAULT_API_VERSION in src/lib/constants.ts.
  apiVersion: text("api_version").notNull().default("v24.0"),
  isDefault: boolean("is_default").notNull().default(false),
  // Auto-generated on creation; user sets this as the verify token in Meta webhook settings.
  webhookVerifyToken: text("webhook_verify_token").notNull().default(""),
  // Optional: used to verify X-Hub-Signature-256 on incoming webhook payloads.
  appSecret: text("app_secret"),
  // Optional per-workspace branding (custom display name + accent colour).
  displayName: text("display_name"),
  brandColor: text("brand_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contact = pgTable(
  "contact",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Contacts are scoped per config so multiple WABA configs can have separate contact bases.
    configId: uuid("config_id").references(() => whatsappConfig.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    notes: text("notes"),
    tags: text("tags").array().notNull().default([]),
    optedOut: boolean("opted_out").notNull().default(false),
    optedOutAt: timestamp("opted_out_at"),
    waId: text("wa_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("contact_user_idx").on(t.userId),
    index("contact_phone_idx").on(t.phone),
    index("contact_config_idx").on(t.configId),
  ],
);

export const contactList = pgTable(
  "contact_list",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("contact_list_user_idx").on(t.userId)],
);

export const contactListMember = pgTable(
  "contact_list_member",
  {
    listId: uuid("list_id")
      .notNull()
      .references(() => contactList.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.listId, t.contactId] })],
);

// ─── Webhook events (raw storage) ────────────────────────────────────────────

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    // Top-level field name from the webhook payload: messages, statuses, errors, etc.
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").notNull(),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("webhook_event_config_idx").on(t.configId),
    index("webhook_event_type_idx").on(t.eventType),
    index("webhook_event_created_idx").on(t.createdAt),
  ],
);

// ─── Received messages (parsed from webhook message events) ──────────────────

export const receivedMessage = pgTable(
  "received_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    // The wamid returned by Meta; deduplication key.
    waMessageId: text("wa_message_id").notNull().unique(),
    fromPhone: text("from_phone").notNull(),
    fromName: text("from_name"),
    messageType: text("message_type").notNull(),
    content: jsonb("content").notNull(),
    // received | read | replied
    status: text("status").notNull().default("received"),
    // Original timestamp from Meta's payload (seconds epoch → stored as timestamp).
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("received_msg_config_idx").on(t.configId),
    index("received_msg_from_idx").on(t.fromPhone),
    index("received_msg_ts_idx").on(t.timestamp),
  ],
);

// ─── Message status updates (delivery receipts from webhook) ─────────────────

export const messageStatus = pgTable(
  "message_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    waMessageId: text("wa_message_id").notNull(),
    // sent | delivered | read | failed
    status: text("status").notNull(),
    recipientPhone: text("recipient_phone"),
    timestamp: timestamp("timestamp").notNull(),
    // Populated on failed status.
    error: jsonb("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("msg_status_config_idx").on(t.configId),
    index("msg_status_wamid_idx").on(t.waMessageId),
  ],
);

// ─── Broadcasts ───────────────────────────────────────────────────────────────

export const broadcast = pgTable(
  "broadcast",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    configId: uuid("config_id").references(() => whatsappConfig.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    // draft | running | paused | completed | failed
    status: text("status").notNull().default("draft"),
    // template | text | media
    messageType: text("message_type").notNull(),
    // Full message payload sent to each recipient (phone substituted at send time).
    payload: jsonb("payload").notNull(),
    totalRecipients: integer("total_recipients").notNull().default(0),
    sentCount: integer("sent_count").notNull().default(0),
    deliveredCount: integer("delivered_count").notNull().default(0),
    readCount: integer("read_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    // Milliseconds to wait between each message send; default 100ms = 10 msg/s.
    rateLimitMs: integer("rate_limit_ms").notNull().default(100),
    scheduledAt: timestamp("scheduled_at"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("broadcast_user_idx").on(t.userId),
    index("broadcast_status_idx").on(t.status),
  ],
);

export const broadcastRecipient = pgTable(
  "broadcast_recipient",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    broadcastId: uuid("broadcast_id")
      .notNull()
      .references(() => broadcast.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contact.id, {
      onDelete: "set null",
    }),
    phone: text("phone").notNull(),
    name: text("name"),
    // pending | sent | delivered | read | failed | skipped
    status: text("status").notNull().default("pending"),
    waMessageId: text("wa_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("broadcast_recipient_broadcast_idx").on(t.broadcastId),
    index("broadcast_recipient_status_idx").on(t.status),
  ],
);

// ─── Scheduled messages ───────────────────────────────────────────────────────

export const scheduledMessage = pgTable(
  "scheduled_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    name: text("name"),
    payload: jsonb("payload").notNull(),
    scheduledAt: timestamp("scheduled_at").notNull(),
    // pending | sent | failed | cancelled
    status: text("status").notNull().default("pending"),
    waMessageId: text("wa_message_id"),
    error: text("error"),
    processedAt: timestamp("processed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("scheduled_msg_user_idx").on(t.userId),
    index("scheduled_msg_status_idx").on(t.status),
    index("scheduled_msg_scheduled_at_idx").on(t.scheduledAt),
  ],
);

// ─── Auto-reply rules ─────────────────────────────────────────────────────────

export const autoReplyRule = pgTable(
  "auto_reply_rule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    configId: uuid("config_id")
      .notNull()
      .references(() => whatsappConfig.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    // keyword | any | greeting | first_message
    triggerType: text("trigger_type").notNull(),
    keywords: text("keywords").array(),
    // exact | contains | starts_with (only applies when triggerType = keyword)
    matchMode: text("match_mode").notNull().default("contains"),
    // text | template
    responseType: text("response_type").notNull(),
    responsePayload: jsonb("response_payload").notNull(),
    // Lower number fires first when multiple rules match.
    priority: integer("priority").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("auto_reply_rule_user_idx").on(t.userId),
    index("auto_reply_rule_config_idx").on(t.configId),
  ],
);
