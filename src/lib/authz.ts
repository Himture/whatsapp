import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  whatsappConfig,
  contact,
  contactList,
  broadcast,
  broadcastRecipient,
  scheduledMessage,
  autoReplyRule,
} from "@/db/schema";

export class AuthorizationError extends Error {
  constructor(message = "Not found or unauthorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function assertOwnsConfig(configId: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: whatsappConfig.id })
    .from(whatsappConfig)
    .where(and(eq(whatsappConfig.id, configId), eq(whatsappConfig.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsContact(contactId: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: contact.id })
    .from(contact)
    .where(and(eq(contact.id, contactId), eq(contact.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsContacts(contactIds: string[], userId: string): Promise<void> {
  if (contactIds.length === 0) return;
  const rows = await getDb()
    .select({ id: contact.id })
    .from(contact)
    .where(and(inArray(contact.id, contactIds), eq(contact.userId, userId)));
  if (rows.length !== new Set(contactIds).size) throw new AuthorizationError();
}

export async function assertOwnsContactList(listId: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: contactList.id })
    .from(contactList)
    .where(and(eq(contactList.id, listId), eq(contactList.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsBroadcast(broadcastId: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: broadcast.id })
    .from(broadcast)
    .where(and(eq(broadcast.id, broadcastId), eq(broadcast.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsBroadcastRecipient(recipientId: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: broadcastRecipient.id })
    .from(broadcastRecipient)
    .innerJoin(broadcast, eq(broadcastRecipient.broadcastId, broadcast.id))
    .where(and(eq(broadcastRecipient.id, recipientId), eq(broadcast.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsScheduledMessage(id: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: scheduledMessage.id })
    .from(scheduledMessage)
    .where(and(eq(scheduledMessage.id, id), eq(scheduledMessage.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}

export async function assertOwnsAutoReplyRule(id: string, userId: string): Promise<void> {
  const [row] = await getDb()
    .select({ id: autoReplyRule.id })
    .from(autoReplyRule)
    .where(and(eq(autoReplyRule.id, id), eq(autoReplyRule.userId, userId)))
    .limit(1);
  if (!row) throw new AuthorizationError();
}
