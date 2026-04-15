export const APP_NAME = "WhatsApp API Manager" as const;
export const APP_DESCRIPTION = "Manage your WhatsApp Cloud API with a clean, intuitive interface" as const;

export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/anthropics/whatsapp-api-manager";

// Block client-side broadcasts above this many recipients until the user confirms.
export const BROADCAST_SAFETY_CHECK_THRESHOLD = 100;

export const WHATSAPP_GRAPH_API_BASE = "https://graph.facebook.com" as const;
export const DEFAULT_API_VERSION = "v21.0" as const;

export const API_VERSIONS = [
  "v21.0",
  "v20.0",
  "v19.0",
  "v18.0",
] as const;

export type ApiVersion = (typeof API_VERSIONS)[number];

export const MESSAGING_PRODUCT = "whatsapp" as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/dashboard",
  WORKSPACES: "/workspaces",
  SETTINGS: "/settings",
  // Business features
  INBOX: "/inbox",
  CONTACTS: "/contacts",
  BROADCASTS: "/broadcasts",
  TEMPLATES: "/templates",
  ANALYTICS: "/analytics",
  SCHEDULE: "/schedule",
  FLOWS: "/flows",
  QR: "/qr",
  // API explorer
  MESSAGES: "/messages",
  MEDIA: "/media",
  PHONE_NUMBERS: "/phone-numbers",
  BUSINESS_PROFILE: "/business-profile",
  REGISTRATION: "/registration",
  WABA: "/waba",
  WEBHOOKS: "/webhooks",
  PAYMENTS: "/payments",
  VERIFICATION: "/verification",
  COMPLIANCE: "/compliance",
  MIGRATION: "/migration",
  HISTORY: "/history",
} as const;

export const NAV_SECTIONS = [
  // Overview
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard", group: "overview" },
  { label: "Workspaces", href: ROUTES.WORKSPACES, icon: "Briefcase", group: "overview" },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: "BarChart3", group: "overview" },
  // Business
  { label: "Inbox", href: ROUTES.INBOX, icon: "Inbox", group: "business" },
  { label: "Contacts", href: ROUTES.CONTACTS, icon: "Users", group: "business" },
  { label: "Broadcasts", href: ROUTES.BROADCASTS, icon: "Megaphone", group: "business" },
  { label: "Templates", href: ROUTES.TEMPLATES, icon: "LayoutTemplate", group: "business" },
  { label: "Flows", href: ROUTES.FLOWS, icon: "GitBranch", group: "business" },
  { label: "Schedule", href: ROUTES.SCHEDULE, icon: "CalendarClock", group: "business" },
  { label: "QR Codes", href: ROUTES.QR, icon: "QrCode", group: "business" },
  // API Explorer
  { label: "Messages", href: ROUTES.MESSAGES, icon: "MessageSquare", group: "api" },
  { label: "Media", href: ROUTES.MEDIA, icon: "Image", group: "api" },
  { label: "Phone Numbers", href: ROUTES.PHONE_NUMBERS, icon: "Phone", group: "api" },
  { label: "Business Profile", href: ROUTES.BUSINESS_PROFILE, icon: "Building2", group: "api" },
  { label: "Registration", href: ROUTES.REGISTRATION, icon: "UserPlus", group: "api" },
  { label: "Two-Step Verification", href: ROUTES.VERIFICATION, icon: "ShieldCheck", group: "api" },
  { label: "WABAs", href: ROUTES.WABA, icon: "Network", group: "api" },
  { label: "Webhooks", href: ROUTES.WEBHOOKS, icon: "Webhook", group: "api" },
  { label: "Payments", href: ROUTES.PAYMENTS, icon: "CreditCard", group: "api" },
  { label: "Compliance", href: ROUTES.COMPLIANCE, icon: "FileCheck", group: "api" },
  { label: "Migration", href: ROUTES.MIGRATION, icon: "ArrowRightLeft", group: "api" },
  // Utility
  { label: "History", href: ROUTES.HISTORY, icon: "Clock", group: "utility" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings", group: "utility" },
] as const;

export const NAV_GROUPS = [
  { key: "overview", label: null },
  { key: "business", label: "Business" },
  { key: "api", label: "API Explorer" },
  { key: "utility", label: null },
] as const;

export type NavGroup = (typeof NAV_GROUPS)[number]["key"];

export const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  AUDIO: "audio",
  VIDEO: "video",
  DOCUMENT: "document",
  STICKER: "sticker",
  LOCATION: "location",
  CONTACTS: "contacts",
  TEMPLATE: "template",
  INTERACTIVE: "interactive",
  REACTION: "reaction",
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];

export const MEDIA_TYPES = {
  IMAGE: { type: "image", accept: "image/jpeg,image/png", maxSize: 5 * 1024 * 1024 },
  AUDIO: { type: "audio", accept: "audio/aac,audio/mp4,audio/mpeg,audio/amr,audio/ogg", maxSize: 16 * 1024 * 1024 },
  VIDEO: { type: "video", accept: "video/mp4,video/3gp", maxSize: 16 * 1024 * 1024 },
  DOCUMENT: { type: "document", accept: "*/*", maxSize: 100 * 1024 * 1024 },
  STICKER: { type: "sticker", accept: "image/webp", maxSize: 500 * 1024 },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ENCRYPTION_ALGORITHM = "aes-256-gcm" as const;
export const ENCRYPTION_IV_LENGTH = 16 as const;
export const ENCRYPTION_TAG_LENGTH = 16 as const;

// ─── Broadcast rate limit options ─────────────────────────────────────────────
// Based on Meta's guidance: Cloud API supports up to 250 messages/second per phone number.
// We use conservative defaults to protect phone number quality rating.
export const BROADCAST_RATE_OPTIONS = [
  { label: "Fast (20 msg/s)", value: 50 },
  { label: "Standard (10 msg/s)", value: 100 },
  { label: "Careful (5 msg/s)", value: 200 },
  { label: "Slow (2 msg/s)", value: 500 },
] as const;

// Daily business-initiated conversation limits per Meta tier.
// Users should monitor their tier in the WhatsApp Manager.
export const META_TIER_LIMITS = [
  { tier: 1, label: "Tier 1", dailyLimit: 1_000, description: "Default for new numbers" },
  { tier: 2, label: "Tier 2", dailyLimit: 10_000, description: "After 1k conversations in 30 days" },
  { tier: 3, label: "Tier 3", dailyLimit: 100_000, description: "After 10k conversations in 30 days" },
  { tier: 4, label: "Tier 4", dailyLimit: Infinity, description: "Unlimited — unlocked by Meta" },
] as const;

// ─── Template categories ──────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES = ["MARKETING", "UTILITY", "AUTHENTICATION"] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "es_AR", label: "Spanish (Argentina)" },
  { code: "es_MX", label: "Spanish (Mexico)" },
  { code: "pt_BR", label: "Portuguese (Brazil)" },
  { code: "pt_PT", label: "Portuguese (Portugal)" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "ar", label: "Arabic" },
  { code: "id", label: "Indonesian" },
  { code: "ms", label: "Malay" },
  { code: "tr", label: "Turkish" },
  { code: "ru", label: "Russian" },
  { code: "ja", label: "Japanese" },
  { code: "zh_CN", label: "Chinese (Simplified)" },
  { code: "zh_TW", label: "Chinese (Traditional)" },
  { code: "ko", label: "Korean" },
] as const;

// ─── Webhook event types ──────────────────────────────────────────────────────

export const WEBHOOK_EVENT_TYPES = [
  "messages",
  "statuses",
  "errors",
  "account_update",
  "template_category_update",
  "message_template_status_update",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

// ─── API documentation links ──────────────────────────────────────────────────

export const API_DOC_LINKS: Record<string, { docs: string; label: string }> = {
  "/messages": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages",
    label: "Messages API",
  },
  "/media": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/media",
    label: "Media API",
  },
  "/phone-numbers": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers",
    label: "Phone Numbers API",
  },
  "/business-profile": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-profiles",
    label: "Business Profiles API",
  },
  "/registration": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/registration",
    label: "Registration API",
  },
  "/verification": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/two-step-verification",
    label: "Two-Step Verification API",
  },
  "/waba": {
    docs: "https://developers.facebook.com/docs/whatsapp/business-management-api/manage-business-accounts",
    label: "WABAs API",
  },
  "/webhooks": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components",
    label: "Webhooks",
  },
  "/payments": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/payments",
    label: "Payments API",
  },
  "/compliance": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/business-compliance",
    label: "Compliance API",
  },
  "/migration": {
    docs: "https://developers.facebook.com/docs/whatsapp/cloud-api/reference/migration",
    label: "Migration API",
  },
  "/templates": {
    docs: "https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates",
    label: "Templates API",
  },
};

export const POSTMAN_COLLECTION_URL = "https://www.postman.com/meta/whatsapp-business-platform/collection/84d01ff8-4253-4720-b454-af661f36acc2" as const;

// Meta's per-message rates for Indian recipients (effective Jan 1, 2026).
export const META_RATES_INR = {
  marketing: 0.8631,
  utility: 0.115,
  authentication: 0.115,
  service: 0,
} as const;

// WhatsApp Business published industry averages (used as benchmark reference lines).
export const INDUSTRY_BENCHMARKS = {
  deliveryRate: 95,
  readRate: 62,
  replyRate: 20,
} as const;

// ─── Plan tiers and limits ────────────────────────────────────────────────────
// Enforced at query time (filter old rows) and at write time (refuse insert above cap).
// Protects DB storage costs at scale — our only variable cost per customer.

export const PLANS = ["free", "starter", "business", "agency"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_LIMITS: Record<Plan, {
  label: string;
  priceInr: number;
  configs: number;
  teamMembers: number;
  contacts: number;
  webhookEventRetentionDays: number;
  broadcastHistoryDays: number;
  features: {
    abTesting: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
    clientWorkspaces: boolean;
  };
}> = {
  free: {
    label: "Free (self-host)",
    priceInr: 0,
    configs: Infinity,
    teamMembers: Infinity,
    contacts: Infinity,
    webhookEventRetentionDays: Infinity,
    broadcastHistoryDays: Infinity,
    features: { abTesting: true, whiteLabel: false, prioritySupport: false, clientWorkspaces: false },
  },
  starter: {
    label: "Starter",
    priceInr: 1499,
    configs: 3,
    teamMembers: 1,
    contacts: 5_000,
    webhookEventRetentionDays: 90,
    broadcastHistoryDays: 90,
    features: { abTesting: false, whiteLabel: false, prioritySupport: false, clientWorkspaces: false },
  },
  business: {
    label: "Business",
    priceInr: 3499,
    configs: 10,
    teamMembers: 5,
    contacts: 50_000,
    webhookEventRetentionDays: 365,
    broadcastHistoryDays: 365,
    features: { abTesting: true, whiteLabel: false, prioritySupport: true, clientWorkspaces: false },
  },
  agency: {
    label: "Agency",
    priceInr: 8999,
    configs: Infinity,
    teamMembers: Infinity,
    contacts: Infinity,
    webhookEventRetentionDays: Infinity,
    broadcastHistoryDays: Infinity,
    features: { abTesting: true, whiteLabel: true, prioritySupport: true, clientWorkspaces: true },
  },
} as const;
