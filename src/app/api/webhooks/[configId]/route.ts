import { createHmac, timingSafeEqual } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import { after } from "next/server";
import type { z } from "zod";
import { getDb } from "@/db";
import {
  whatsappConfig,
  webhookEvent,
  receivedMessage,
  messageStatus,
} from "@/db/schema";
import { decrypt } from "@/lib/encryption";
import { findMatchingRule } from "@/app/(dashboard)/flows/match";
import { checkRateLimit } from "@/lib/rate-limit";
import { MetaWebhookPayloadSchema, UuidSchema } from "@/lib/validation";

type MetaWebhookPayload = z.infer<typeof MetaWebhookPayloadSchema>;
type MetaMessage = NonNullable<NonNullable<MetaWebhookPayload["entry"][number]["changes"][number]["value"]["messages"]>[number]> & {
  text?: { body: string };
  image?: Record<string, unknown>;
  audio?: Record<string, unknown>;
  video?: Record<string, unknown>;
  document?: Record<string, unknown>;
  sticker?: Record<string, unknown>;
  location?: Record<string, unknown>;
  contacts?: unknown[];
  interactive?: Record<string, unknown>;
  button?: { text?: string };
  reaction?: Record<string, unknown>;
};

const MAX_PAYLOAD_BYTES = 1_048_576; // 1 MiB
const RATE_LIMIT = { capacity: 200, refillPer: 200, intervalMs: 60_000 };

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function verifySignature(body: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return safeEqualStrings(signatureHeader, expected);
}

// GET: Meta's hub.challenge probe — verify the verify token then echo back hub.challenge.
// Always answers (no signature yet at this stage), but compares the verify token
// in constant time against the stored value.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ configId: string }> },
) {
  const { configId: rawConfigId } = await params;
  const configId = UuidSchema.safeParse(rawConfigId);
  if (!configId.success) return new Response("Bad Request", { status: 400 });

  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("Bad Request", { status: 400 });
  }

  const [config] = await getDb()
    .select({ webhookVerifyToken: whatsappConfig.webhookVerifyToken })
    .from(whatsappConfig)
    .where(eq(whatsappConfig.id, configId.data));

  if (!config || !safeEqualStrings(config.webhookVerifyToken, token)) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(challenge, { status: 200 });
}

// POST: Receive webhook events from Meta.
// Fail-closed: any side effect (storing events, sending auto-replies) is gated
// behind a verified HMAC signature. Without an appSecret on the config we still
// 200 (Meta retries otherwise), but we drop the payload — no inserts, no sends.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ configId: string }> },
) {
  const { configId: rawConfigId } = await params;
  const parsed = UuidSchema.safeParse(rawConfigId);
  if (!parsed.success) return new Response("Bad Request", { status: 400 });
  const configId = parsed.data;

  // Per-config rate limit before doing any DB work or running HMAC.
  if (!checkRateLimit("webhook", configId, RATE_LIMIT)) {
    return new Response("Too Many Requests", { status: 429 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_PAYLOAD_BYTES) {
    return new Response("Payload Too Large", { status: 413 });
  }

  const [config] = await getDb()
    .select({
      id: whatsappConfig.id,
      appSecret: whatsappConfig.appSecret,
      accessToken: whatsappConfig.accessToken,
      phoneNumberId: whatsappConfig.phoneNumberId,
      apiVersion: whatsappConfig.apiVersion,
    })
    .from(whatsappConfig)
    .where(eq(whatsappConfig.id, configId));

  if (!config) {
    return new Response("Not Found", { status: 404 });
  }

  // Fail-closed: without an app secret we cannot verify signature, so we can't
  // trust the payload. Acknowledge to Meta but drop the data.
  if (!config.appSecret) {
    console.warn(`[webhook] payload dropped — appSecret not configured for config ${configId}`);
    return new Response("OK", { status: 200 });
  }

  let appSecret: string;
  try {
    appSecret = decrypt(config.appSecret);
  } catch {
    console.error(`[webhook] failed to decrypt appSecret for config ${configId}`);
    return new Response("OK", { status: 200 });
  }

  const signature = request.headers.get("X-Hub-Signature-256");
  if (!verifySignature(rawBody, signature, appSecret)) {
    return new Response("Forbidden", { status: 403 });
  }

  let payload: MetaWebhookPayload;
  try {
    const parsedBody = JSON.parse(rawBody);
    payload = MetaWebhookPayloadSchema.parse(parsedBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Return 200 immediately — Meta requires acknowledgement within 20 seconds.
  // after() runs processPayload after the response is sent.
  let accessToken: string;
  try {
    accessToken = decrypt(config.accessToken);
  } catch {
    console.error(`[webhook] failed to decrypt accessToken for config ${configId}`);
    return new Response("OK", { status: 200 });
  }

  const apiVersion = config.apiVersion;
  after(() =>
    processPayload(configId, payload, accessToken, apiVersion).catch((err) => {
      console.error(`[webhook] processing error for config ${configId}:`, err);
    }),
  );

  return new Response("OK", { status: 200 });
}

async function processPayload(
  configId: string,
  payload: MetaWebhookPayload,
  accessToken: string,
  apiVersion: string,
): Promise<void> {
  const db = getDb();

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const { field, value } = change;

      await db.insert(webhookEvent).values({
        configId,
        eventType: field,
        payload: value as Record<string, unknown>,
        processedAt: new Date(),
      });

      if (field !== "messages") continue;

      const contacts = value.contacts ?? [];
      const contactsByWaId = new Map(contacts.map((c) => [c.wa_id, c]));

      const incomingMessages = (value.messages ?? []) as MetaMessage[];
      const incomingIds = incomingMessages.map((m) => m.id);

      const existingIds = incomingIds.length > 0
        ? new Set(
            (await db
              .select({ id: receivedMessage.waMessageId })
              .from(receivedMessage)
              .where(inArray(receivedMessage.waMessageId, incomingIds))
            ).map((r) => r.id),
          )
        : new Set<string>();

      for (const msg of incomingMessages) {
        if (existingIds.has(msg.id)) continue;

        const senderProfile = contactsByWaId.get(msg.from);
        const fromName = senderProfile?.profile?.name ?? null;
        const content = buildMessageContent(msg);

        await db.insert(receivedMessage).values({
          configId,
          waMessageId: msg.id,
          fromPhone: msg.from,
          fromName,
          messageType: msg.type,
          content,
          status: "received",
          timestamp: new Date(parseInt(msg.timestamp, 10) * 1000),
        });

        const textBody =
          msg.type === "text" ? (msg.text?.body ?? "") :
          msg.type === "button" ? (msg.button?.text ?? "") :
          "";

        if (textBody) {
          const previousMessages = await db
            .select({ id: receivedMessage.id })
            .from(receivedMessage)
            .where(and(eq(receivedMessage.configId, configId), eq(receivedMessage.fromPhone, msg.from)));
          const isFirstMessage = previousMessages.length === 1;

          const matchedRule = await findMatchingRule(configId, textBody, isFirstMessage);
          if (matchedRule) {
            await sendAutoReply(configId, msg.from, matchedRule.responsePayload, accessToken, apiVersion);
          }
        }
      }

      for (const status of value.statuses ?? []) {
        // Failed statuses carry an errors[] array (code/title/details) Meta wants
        // surfaced — persist it instead of discarding it as null.
        const statusErrors = (status as { errors?: unknown[] }).errors;
        await db.insert(messageStatus).values({
          configId,
          waMessageId: status.id,
          status: status.status,
          recipientPhone: status.recipient_id,
          timestamp: new Date(parseInt(status.timestamp, 10) * 1000),
          error: statusErrors && statusErrors.length > 0 ? statusErrors : null,
        });
      }
    }
  }
}

function buildMessageContent(msg: MetaMessage): Record<string, unknown> {
  switch (msg.type) {
    case "text": return { body: msg.text?.body ?? "" };
    case "image": return msg.image ?? {};
    case "audio": return msg.audio ?? {};
    case "video": return msg.video ?? {};
    case "document": return msg.document ?? {};
    case "sticker": return msg.sticker ?? {};
    case "location": return msg.location ?? {};
    case "contacts": return { contacts: msg.contacts ?? [] };
    case "interactive": return msg.interactive ?? {};
    case "button": return (msg.button as Record<string, unknown>) ?? {};
    case "reaction": return msg.reaction ?? {};
    default: return {};
  }
}

async function sendAutoReply(
  configId: string,
  toPhone: string,
  responsePayload: Record<string, unknown>,
  accessToken: string,
  apiVersion: string,
): Promise<void> {
  const [config] = await getDb()
    .select({ phoneNumberId: whatsappConfig.phoneNumberId })
    .from(whatsappConfig)
    .where(eq(whatsappConfig.id, configId));

  if (!config) return;

  try {
    const body = {
      messaging_product: "whatsapp",
      to: toPhone,
      ...responsePayload,
    };

    await fetch(
      `https://graph.facebook.com/${apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
  } catch (error) {
    console.error("[auto-reply] send error:", error);
  }
}
