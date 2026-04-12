"use server";

import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { whatsappConfig } from "@/db/schema";
import { encrypt, decrypt } from "@/lib/encryption";
import type { ApiVersion } from "@/lib/constants";

interface ConfigInput {
  name: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId?: string;
  apiVersion: ApiVersion;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

async function getAuthenticatedUserId(): Promise<string> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getConfigs() {
  const userId = await getAuthenticatedUserId();

  const configs = await getDb()
    .select()
    .from(whatsappConfig)
    .where(eq(whatsappConfig.userId, userId))
    .orderBy(whatsappConfig.createdAt);

  return configs.map((config) => ({
    ...config,
    accessToken: decrypt(config.accessToken),
  }));
}

export async function createConfig(input: ConfigInput): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const existingConfigs = await getDb()
      .select({ id: whatsappConfig.id })
      .from(whatsappConfig)
      .where(eq(whatsappConfig.userId, userId));

    const isFirst = existingConfigs.length === 0;

    await getDb().insert(whatsappConfig).values({
      userId,
      name: input.name,
      accessToken: encrypt(input.accessToken),
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId,
      businessPortfolioId: input.businessPortfolioId ?? null,
      apiVersion: input.apiVersion,
      isDefault: isFirst,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to create config:", error);
    return { success: false, error: "Failed to create configuration" };
  }
}

export async function updateConfig(
  configId: string,
  input: Partial<ConfigInput>,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const values: Record<string, unknown> = { updatedAt: new Date() };

    if (input.name !== undefined) values.name = input.name;
    if (input.accessToken !== undefined) values.accessToken = encrypt(input.accessToken);
    if (input.phoneNumberId !== undefined) values.phoneNumberId = input.phoneNumberId;
    if (input.wabaId !== undefined) values.wabaId = input.wabaId;
    if (input.businessPortfolioId !== undefined) values.businessPortfolioId = input.businessPortfolioId;
    if (input.apiVersion !== undefined) values.apiVersion = input.apiVersion;

    await getDb()
      .update(whatsappConfig)
      .set(values)
      .where(
        and(eq(whatsappConfig.id, configId), eq(whatsappConfig.userId, userId)),
      );

    return { success: true };
  } catch (error) {
    console.error("Failed to update config:", error);
    return { success: false, error: "Failed to update configuration" };
  }
}

export async function deleteConfig(configId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    await getDb()
      .delete(whatsappConfig)
      .where(
        and(eq(whatsappConfig.id, configId), eq(whatsappConfig.userId, userId)),
      );

    return { success: true };
  } catch (error) {
    console.error("Failed to delete config:", error);
    return { success: false, error: "Failed to delete configuration" };
  }
}

export async function setDefaultConfig(configId: string): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    await getDb()
      .update(whatsappConfig)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(whatsappConfig.userId, userId));

    await getDb()
      .update(whatsappConfig)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(
        and(eq(whatsappConfig.id, configId), eq(whatsappConfig.userId, userId)),
      );

    return { success: true };
  } catch (error) {
    console.error("Failed to set default config:", error);
    return { success: false, error: "Failed to set default configuration" };
  }
}
