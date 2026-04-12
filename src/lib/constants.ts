export const APP_NAME = "WhatsApp API Manager" as const;
export const APP_DESCRIPTION = "Manage your WhatsApp Cloud API with a clean, intuitive interface" as const;

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
  SETTINGS: "/settings",
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
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Messages", href: ROUTES.MESSAGES, icon: "MessageSquare" },
  { label: "Media", href: ROUTES.MEDIA, icon: "Image" },
  { label: "Phone Numbers", href: ROUTES.PHONE_NUMBERS, icon: "Phone" },
  { label: "Business Profile", href: ROUTES.BUSINESS_PROFILE, icon: "Building2" },
  { label: "Registration", href: ROUTES.REGISTRATION, icon: "UserPlus" },
  { label: "Two-Step Verification", href: ROUTES.VERIFICATION, icon: "ShieldCheck" },
  { label: "WABAs", href: ROUTES.WABA, icon: "Network" },
  { label: "Webhooks", href: ROUTES.WEBHOOKS, icon: "Webhook" },
  { label: "Payments", href: ROUTES.PAYMENTS, icon: "CreditCard" },
  { label: "Compliance", href: ROUTES.COMPLIANCE, icon: "FileCheck" },
  { label: "Migration", href: ROUTES.MIGRATION, icon: "ArrowRightLeft" },
  { label: "History", href: ROUTES.HISTORY, icon: "Clock" },
  { label: "Settings", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;

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
};

export const POSTMAN_COLLECTION_URL = "https://www.postman.com/meta/whatsapp-business-platform/collection/84d01ff8-4253-4720-b454-af661f36acc2" as const;
