"use server";

import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import {
  assertOwnsContact,
  assertOwnsContacts,
  assertOwnsContactList,
  assertOwnsConfig,
} from "@/lib/authz";
import { getDb } from "@/db";
import {
  contact,
  contactList,
  contactListMember,
} from "@/db/schema";
import {
  ContactInputSchema,
  ContactUpdateSchema,
  ContactListInputSchema,
  UuidSchema,
} from "@/lib/validation";
import { z } from "zod";
import type { ContactRecord, ContactListRecord, ActionResult } from "@/lib/stores/types";

const ContactIdsSchema = z.array(UuidSchema).min(1).max(1000);

// Mirror of the local store's normPhone so remote (Postgres) mode dedupes and
// validates phone numbers identically to local mode.
function normPhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}

export async function getContacts(configId?: string): Promise<ContactRecord[]> {
  const userId = await requireUserId();
  const cid = configId ? UuidSchema.parse(configId) : undefined;
  if (cid) await assertOwnsConfig(cid, userId);

  const conditions = cid
    ? and(eq(contact.userId, userId), eq(contact.configId, cid))
    : eq(contact.userId, userId);

  const rows = await getDb().select().from(contact).where(conditions).orderBy(contact.createdAt);
  return rows.map(mapContact);
}

export async function createContact(input: unknown): Promise<ActionResult & { id?: string }> {
  try {
    const data = ContactInputSchema.parse(input);
    const userId = await requireUserId();
    if (data.configId) await assertOwnsConfig(data.configId, userId);

    // Validate + reject duplicate phone (parity with the local store), so a
    // manual add can't create a second contact that double-sends.
    const phoneKey = normPhone(data.phone);
    if (!/^\+?\d{7,15}$/.test(phoneKey)) {
      return { success: false, error: "Enter a valid phone number (7–15 digits, optional leading +)" };
    }
    const existing = await getDb().select({ phone: contact.phone }).from(contact).where(eq(contact.userId, userId));
    if (existing.some((c) => normPhone(c.phone) === phoneKey)) {
      return { success: false, error: "A contact with this phone already exists" };
    }

    const [row] = await getDb()
      .insert(contact)
      .values({
        userId,
        configId: data.configId ?? null,
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
      })
      .returning({ id: contact.id });
    return { success: true, id: row?.id };
  } catch (error) {
    console.error("createContact:", error);
    return { success: false, error: "Failed to create contact" };
  }
}

export async function updateContact(id: string, input: unknown): Promise<ActionResult> {
  try {
    const contactId = UuidSchema.parse(id);
    const data = ContactUpdateSchema.parse(input);
    const userId = await requireUserId();
    await assertOwnsContact(contactId, userId);
    if (data.configId) await assertOwnsConfig(data.configId, userId);

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) values.name = data.name;
    if (data.phone !== undefined) values.phone = data.phone;
    if (data.email !== undefined) values.email = data.email ?? null;
    if (data.notes !== undefined) values.notes = data.notes ?? null;
    if (data.tags !== undefined) values.tags = data.tags;
    if (data.configId !== undefined) values.configId = data.configId ?? null;

    await getDb()
      .update(contact)
      .set(values)
      .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("updateContact:", error);
    return { success: false, error: "Failed to update contact" };
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const contactId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await assertOwnsContact(contactId, userId);
    await getDb().delete(contact).where(and(eq(contact.id, contactId), eq(contact.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("deleteContact:", error);
    return { success: false, error: "Failed to delete contact" };
  }
}

export async function importContacts(
  contacts: unknown,
): Promise<{ imported: number; errors: string[] }> {
  const userId = await requireUserId();
  const list = z.array(ContactInputSchema).max(10_000).parse(contacts);
  let imported = 0;
  const errors: string[] = [];

  for (const input of list) {
    try {
      if (input.configId) await assertOwnsConfig(input.configId, userId);
      await getDb().insert(contact).values({
        userId,
        configId: input.configId ?? null,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
      });
      imported++;
    } catch (error) {
      errors.push(
        `Row ${imported + errors.length + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  return { imported, errors };
}

export async function setContactOptOut(id: string, optedOut: boolean): Promise<ActionResult> {
  try {
    const contactId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await assertOwnsContact(contactId, userId);
    await getDb()
      .update(contact)
      .set({ optedOut, optedOutAt: optedOut ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(contact.id, contactId), eq(contact.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("setContactOptOut:", error);
    return { success: false, error: "Failed to update opt-out status" };
  }
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function getContactLists(): Promise<ContactListRecord[]> {
  const userId = await requireUserId();
  const lists = await getDb()
    .select()
    .from(contactList)
    .where(eq(contactList.userId, userId))
    .orderBy(contactList.createdAt);

  if (lists.length === 0) return [];

  // Count members only for lists owned by this user — never trust the membership table alone.
  const listIds = lists.map((l) => l.id);
  const memberRows = await getDb()
    .select({ listId: contactListMember.listId })
    .from(contactListMember)
    .innerJoin(contactList, eq(contactListMember.listId, contactList.id))
    .where(and(eq(contactList.userId, userId)));

  const counts = new Map<string, number>();
  for (const row of memberRows) {
    if (listIds.includes(row.listId)) {
      counts.set(row.listId, (counts.get(row.listId) ?? 0) + 1);
    }
  }

  return lists.map((list) => ({
    id: list.id,
    userId: list.userId,
    name: list.name,
    description: list.description ?? null,
    memberCount: counts.get(list.id) ?? 0,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  }));
}

export async function createContactList(input: unknown): Promise<ActionResult & { id?: string }> {
  try {
    const data = ContactListInputSchema.parse(input);
    const userId = await requireUserId();
    const [row] = await getDb()
      .insert(contactList)
      .values({ userId, name: data.name, description: data.description ?? null })
      .returning({ id: contactList.id });
    return { success: true, id: row?.id };
  } catch (error) {
    console.error("createContactList:", error);
    return { success: false, error: "Failed to create list" };
  }
}

export async function deleteContactList(id: string): Promise<ActionResult> {
  try {
    const listId = UuidSchema.parse(id);
    const userId = await requireUserId();
    await assertOwnsContactList(listId, userId);
    await getDb()
      .delete(contactList)
      .where(and(eq(contactList.id, listId), eq(contactList.userId, userId)));
    return { success: true };
  } catch (error) {
    console.error("deleteContactList:", error);
    return { success: false, error: "Failed to delete list" };
  }
}

export async function addContactsToList(listId: string, contactIds: string[]): Promise<ActionResult> {
  try {
    const lid = UuidSchema.parse(listId);
    const ids = ContactIdsSchema.parse(contactIds);
    const userId = await requireUserId();
    await assertOwnsContactList(lid, userId);
    await assertOwnsContacts(ids, userId);

    const values = ids.map((contactId) => ({ listId: lid, contactId }));
    await getDb().insert(contactListMember).values(values).onConflictDoNothing();
    return { success: true };
  } catch (error) {
    console.error("addContactsToList:", error);
    return { success: false, error: "Failed to add contacts to list" };
  }
}

export async function removeContactFromList(listId: string, contactId: string): Promise<ActionResult> {
  try {
    const lid = UuidSchema.parse(listId);
    const cid = UuidSchema.parse(contactId);
    const userId = await requireUserId();
    await assertOwnsContactList(lid, userId);
    await getDb()
      .delete(contactListMember)
      .where(and(eq(contactListMember.listId, lid), eq(contactListMember.contactId, cid)));
    return { success: true };
  } catch (error) {
    console.error("removeContactFromList:", error);
    return { success: false, error: "Failed to remove contact from list" };
  }
}

export async function getListMembers(listId: string): Promise<ContactRecord[]> {
  const lid = UuidSchema.parse(listId);
  const userId = await requireUserId();
  await assertOwnsContactList(lid, userId);

  const members = await getDb()
    .select({ contact })
    .from(contactListMember)
    .innerJoin(contact, eq(contactListMember.contactId, contact.id))
    .where(and(eq(contactListMember.listId, lid), eq(contact.userId, userId)));

  return members.map(({ contact: c }) => mapContact(c));
}

function mapContact(c: typeof contact.$inferSelect): ContactRecord {
  return {
    id: c.id,
    userId: c.userId,
    configId: c.configId ?? null,
    name: c.name,
    phone: c.phone,
    email: c.email ?? null,
    notes: c.notes ?? null,
    tags: c.tags ?? [],
    optedOut: c.optedOut,
    optedOutAt: c.optedOutAt?.toISOString() ?? null,
    waId: c.waId ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
