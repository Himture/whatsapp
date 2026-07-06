"use server";

import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { getDb } from "@/db";
import { whatsappConfig } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/encryption";
import { ConfigInputSchema, ConfigUpdateSchema, UuidSchema } from "@/lib/validation";
import type { z } from "zod";

type ConfigInput = z.infer<typeof ConfigInputSchema>;
type ConfigUpdate = z.infer<typeof ConfigUpdateSchema>;

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function getConfigs() {
  const userId = await requireUserId();

  const configs = await getDb()
    .select()
    .from(whatsappConfig)
    .where(eq(whatsappConfig.userId, userId))
    .orderBy(whatsappConfig.createdAt);

  return configs.map((config) => ({
    ...config,
    accessToken: decrypt(config.accessToken),
    // The plaintext app secret must never reach the browser — it's only needed
    // server-side for webhook HMAC verification. The UI only consumes this as a
    // presence indicator, so expose a redacted placeholder (truthy when set,
    // null when absent) instead of the decrypted value.
    appSecret: config.appSecret ? "set" : null,
    webhookVerifyToken: config.webhookVerifyToken,
  }));
}

export async function createConfig(input: ConfigInput): Promise<ActionResult> {
  try {
    const data = ConfigInputSchema.parse(input);
    const userId = await requireUserId();

    const existingConfigs = await getDb()
      .select({ id: whatsappConfig.id })
      .from(whatsappConfig)
      .where(eq(whatsappConfig.userId, userId));

    const isFirst = existingConfigs.length === 0;

    await getDb().insert(whatsappConfig).values({
      userId,
      name: data.name,
      accessToken: encrypt(data.accessToken),
      phoneNumberId: data.phoneNumberId,
      wabaId: data.wabaId,
      businessPortfolioId: data.businessPortfolioId ?? null,
      apiVersion: data.apiVersion,
      displayName: data.displayName ?? null,
      brandColor: data.brandColor ?? null,
      appSecret: data.appSecret ? encrypt(data.appSecret) : null,
      appId: data.appId ?? null,
      isDefault: isFirst,
      // A unique token the user registers in Meta's webhook settings.
      // Meta sends it back on each request so we can verify authenticity.
      webhookVerifyToken: crypto.randomUUID(),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create config:", error);
    return { success: false, error: errorMessage(error, "Failed to create configuration") };
  }
}

export async function updateConfig(
  configId: string,
  input: ConfigUpdate,
): Promise<ActionResult> {
  try {
    const id = UuidSchema.parse(configId);
    const data = ConfigUpdateSchema.parse(input);
    const userId = await requireUserId();

    const values: Record<string, unknown> = { updatedAt: new Date() };

    if (data.name !== undefined) values.name = data.name;
    if (data.accessToken !== undefined) values.accessToken = encrypt(data.accessToken);
    if (data.phoneNumberId !== undefined) values.phoneNumberId = data.phoneNumberId;
    if (data.wabaId !== undefined) values.wabaId = data.wabaId;
    if (data.businessPortfolioId !== undefined) values.businessPortfolioId = data.businessPortfolioId ?? null;
    if (data.apiVersion !== undefined) values.apiVersion = data.apiVersion;
    if (data.displayName !== undefined) values.displayName = data.displayName ?? null;
    if (data.brandColor !== undefined) values.brandColor = data.brandColor ?? null;
    if (data.appSecret !== undefined) values.appSecret = data.appSecret ? encrypt(data.appSecret) : null;
    if (data.appId !== undefined) values.appId = data.appId ?? null;

    await getDb()
      .update(whatsappConfig)
      .set(values)
      .where(and(eq(whatsappConfig.id, id), eq(whatsappConfig.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("Failed to update config:", error);
    return { success: false, error: errorMessage(error, "Failed to update configuration") };
  }
}

export async function deleteConfig(configId: string): Promise<ActionResult> {
  try {
    const id = UuidSchema.parse(configId);
    const userId = await requireUserId();

    await getDb()
      .delete(whatsappConfig)
      .where(and(eq(whatsappConfig.id, id), eq(whatsappConfig.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete config:", error);
    return { success: false, error: errorMessage(error, "Failed to delete configuration") };
  }
}

export async function setDefaultConfig(configId: string): Promise<ActionResult> {
  try {
    const id = UuidSchema.parse(configId);
    const userId = await requireUserId();

    await getDb()
      .update(whatsappConfig)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(whatsappConfig.userId, userId));

    await getDb()
      .update(whatsappConfig)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(whatsappConfig.id, id), eq(whatsappConfig.userId, userId)));

    return { success: true };
  } catch (error) {
    console.error("Failed to set default config:", error);
    return { success: false, error: errorMessage(error, "Failed to set default configuration") };
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.name === "ZodError") return "Invalid input";
  if (error instanceof Error && error.message === "Unauthorized") return "Unauthorized";
  return fallback;
}
