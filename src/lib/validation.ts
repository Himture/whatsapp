import { z } from "zod";
import { API_VERSIONS } from "./constants";

export const BrandColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{3,8}$/, "Brand color must be a hex value like #1A2B3C");

export const PhoneE164Schema = z
  .string()
  .regex(/^\+?[1-9]\d{6,14}$/, "Phone must be in E.164 format");

export const ApiVersionSchema = z.enum(API_VERSIONS);

export const UuidSchema = z.uuid();

const NonEmptyTrimmed = z.string().trim().min(1);

export const ConfigInputSchema = z.object({
  name: NonEmptyTrimmed.max(120),
  accessToken: z.string().trim().min(20).max(2048),
  phoneNumberId: NonEmptyTrimmed.max(64),
  wabaId: NonEmptyTrimmed.max(64),
  businessPortfolioId: z.string().trim().max(64).optional(),
  apiVersion: ApiVersionSchema,
  displayName: z.string().trim().max(120).optional(),
  brandColor: BrandColorSchema.optional(),
  appSecret: z.string().trim().min(20).max(256).optional(),
  appId: z.string().trim().max(64).optional(),
});

export const ConfigUpdateSchema = ConfigInputSchema.partial();

export const ContactInputSchema = z.object({
  configId: UuidSchema.optional(),
  name: NonEmptyTrimmed.max(120),
  phone: PhoneE164Schema,
  email: z.email().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(50).optional(),
});

export const ContactUpdateSchema = ContactInputSchema.partial();

export const ContactListInputSchema = z.object({
  name: NonEmptyTrimmed.max(120),
  description: z.string().trim().max(500).optional(),
});

export const BroadcastInputSchema = z.object({
  configId: UuidSchema,
  name: NonEmptyTrimmed.max(120),
  messageType: z.enum(["template", "text", "media"]),
  payload: z.record(z.string(), z.unknown()),
  rateLimitMs: z.number().int().min(50).max(5000).optional(),
  scheduledAt: z.iso.datetime().optional(),
});

export const ScheduledMessageInputSchema = z.object({
  configId: UuidSchema,
  name: z.string().trim().max(120).optional(),
  payload: z.record(z.string(), z.unknown()),
  scheduledAt: z.iso.datetime(),
});

export const AutoReplyRuleInputSchema = z.object({
  configId: UuidSchema,
  name: NonEmptyTrimmed.max(120),
  triggerType: z.enum(["keyword", "any", "greeting", "first_message"]),
  keywords: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  matchMode: z.enum(["exact", "contains", "starts_with"]).optional(),
  responseType: z.enum(["text", "template"]),
  responsePayload: z.record(z.string(), z.unknown()),
  priority: z.number().int().min(0).max(10_000).optional(),
});

const MetaMessageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
}).loose();

const MetaStatusSchema = z.object({
  id: z.string(),
  recipient_id: z.string(),
  status: z.enum(["sent", "delivered", "read", "failed"]),
  timestamp: z.string(),
}).loose();

export const MetaWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.object({
            messaging_product: z.string().optional(),
            metadata: z.object({
              display_phone_number: z.string(),
              phone_number_id: z.string(),
            }).optional(),
            contacts: z.array(
              z.object({
                profile: z.object({ name: z.string() }).loose(),
                wa_id: z.string(),
              }).loose(),
            ).optional(),
            messages: z.array(MetaMessageSchema).optional(),
            statuses: z.array(MetaStatusSchema).optional(),
          }).loose(),
        }).loose(),
      ),
    }).loose(),
  ),
}).loose();
