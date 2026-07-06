"use client";

import { getLocalDb } from "./db";
import type {
  ContactStore,
  ContactRecord,
  ContactInput,
  ContactListRecord,
  ContactListInput,
  ActionResult,
} from "../types";

const LOCAL_USER_ID = "local";

// Normalize a phone number for duplicate matching: drop spaces, dashes, parens,
// and dots but keep a leading "+". "+1 (555) 123-4567" and "+15551234567" match.
// Exported so the contacts UI can normalize the search term the same way.
export function normPhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, "");
}

// Normalize an email for duplicate matching. Only a properly-formatted address
// is a dedup key; blanks and placeholders ("n/a", "-", "none", a shared value
// repeated on every CSV row) collapse to "" so they never trigger a false
// "duplicate" skip. Phone stays the primary identity for a WhatsApp contact.
function normEmail(email: string | null | undefined): string {
  const e = (email ?? "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : "";
}

export class LocalContactStore implements ContactStore {
  async getContacts(configId?: string): Promise<ContactRecord[]> {
    const db = await getLocalDb();
    const all = (await db.getAll("contacts")) as ContactRecord[];
    const filtered = configId ? all.filter((c) => c.configId === configId) : all;
    return filtered.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    const db = await getLocalDb();
    return ((await db.get("contacts", id)) as ContactRecord | undefined) ?? null;
  }

  async createContact(input: ContactInput): Promise<ActionResult & { id?: string }> {
    try {
      const db = await getLocalDb();

      // Light phone sanity check: after normalization it should look like a
      // phone — an optional leading "+" then 7–15 digits. Guards against typos
      // that would silently produce an unsendable contact.
      const phoneKey = normPhone(input.phone);
      if (!/^\+?\d{7,15}$/.test(phoneKey)) {
        return { success: false, error: "Enter a valid phone number (7–15 digits, optional leading +)" };
      }

      // Reject duplicates by normalized phone so a manual add can't create a
      // second contact that double-sends. Phone is the primary WhatsApp identity.
      const existing = (await db.getAll("contacts")) as ContactRecord[];
      if (existing.some((c) => normPhone(c.phone) === phoneKey)) {
        return { success: false, error: "A contact with this phone already exists" };
      }

      const now = new Date().toISOString();
      const record: ContactRecord = {
        id: crypto.randomUUID(),
        userId: LOCAL_USER_ID,
        configId: input.configId ?? null,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        optedOut: false,
        optedOutAt: null,
        waId: null,
        createdAt: now,
        updatedAt: now,
      };
      await db.add("contacts", record);
      return { success: true, id: record.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create contact" };
    }
  }

  async updateContact(id: string, input: Partial<ContactInput>): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("contacts", id)) as ContactRecord | undefined;
      if (!existing) return { success: false, error: "Contact not found" };

      const updated: ContactRecord = {
        ...existing,
        ...{
          name: input.name ?? existing.name,
          phone: input.phone ?? existing.phone,
          email: input.email !== undefined ? (input.email ?? null) : existing.email,
          notes: input.notes !== undefined ? (input.notes ?? null) : existing.notes,
          tags: input.tags ?? existing.tags,
          configId: input.configId !== undefined ? (input.configId ?? null) : existing.configId,
        },
        updatedAt: new Date().toISOString(),
      };
      await db.put("contacts", updated);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update contact" };
    }
  }

  async deleteContact(id: string): Promise<ActionResult> {
    const result = await this.deleteContacts([id]);
    return result.success ? { success: true } : { success: false, error: result.error };
  }

  async deleteContacts(ids: string[]): Promise<ActionResult & { deleted: number }> {
    try {
      const db = await getLocalDb();
      const tx = db.transaction(["contacts", "contactListMembers"], "readwrite");
      const contactStore = tx.objectStore("contacts");
      const memberStore = tx.objectStore("contactListMembers");
      const byContact = memberStore.index("contactId");
      for (const id of ids) {
        await contactStore.delete(id);
        // Remove this contact's list memberships so no orphan rows remain.
        const members = (await byContact.getAll(id)) as Array<{ listId: string; contactId: string }>;
        for (const m of members) {
          await memberStore.delete([m.listId, m.contactId]);
        }
      }
      await tx.done;
      return { success: true, deleted: ids.length };
    } catch (error) {
      return { success: false, deleted: 0, error: error instanceof Error ? error.message : "Failed to delete contacts" };
    }
  }

  async importContacts(
    contacts: ContactInput[],
    options?: { listId?: string },
  ): Promise<{ imported: number; skipped: number; errors: string[]; contactIds: string[] }> {
    const db = await getLocalDb();
    const errors: string[] = [];
    const contactIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Build lookup maps from existing contacts so we can skip duplicates by
    // phone or email. Rows earlier in the same file are added as we go, so
    // in-file duplicates are caught too.
    const existing = (await db.getAll("contacts")) as ContactRecord[];
    const byPhone = new Map<string, string>();
    const byEmail = new Map<string, string>();
    for (const c of existing) {
      byPhone.set(normPhone(c.phone), c.id);
      const e = normEmail(c.email);
      if (e) byEmail.set(e, c.id);
    }

    for (const input of contacts) {
      const phoneKey = normPhone(input.phone);
      const emailKey = normEmail(input.email);
      const match = byPhone.get(phoneKey) ?? (emailKey ? byEmail.get(emailKey) : undefined);
      if (match) {
        // Duplicate: don't create, but still surface its id so the caller can
        // add the existing contact to the target list.
        skipped++;
        contactIds.push(match);
        continue;
      }

      try {
        const now = new Date().toISOString();
        const record: ContactRecord = {
          id: crypto.randomUUID(),
          userId: LOCAL_USER_ID,
          configId: input.configId ?? null,
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          notes: input.notes ?? null,
          tags: input.tags ?? [],
          optedOut: false,
          optedOutAt: null,
          waId: null,
          createdAt: now,
          updatedAt: now,
        };
        await db.add("contacts", record);
        imported++;
        contactIds.push(record.id);
        byPhone.set(phoneKey, record.id);
        if (emailKey) byEmail.set(emailKey, record.id);
      } catch (error) {
        errors.push(
          `Row ${imported + skipped + errors.length + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    if (options?.listId && contactIds.length > 0) {
      await this.addToList(options.listId, contactIds);
    }

    return { imported, skipped, errors, contactIds };
  }

  async setOptOut(id: string, optedOut: boolean): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const existing = (await db.get("contacts", id)) as ContactRecord | undefined;
      if (!existing) return { success: false, error: "Contact not found" };
      await db.put("contacts", {
        ...existing,
        optedOut,
        optedOutAt: optedOut ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update opt-out" };
    }
  }

  async getLists(): Promise<ContactListRecord[]> {
    const db = await getLocalDb();
    const lists = (await db.getAll("contactLists")) as Array<Omit<ContactListRecord, "memberCount">>;
    const allMembers = (await db.getAll("contactListMembers")) as Array<{ listId: string; contactId: string }>;

    return lists.map((list) => ({
      ...list,
      memberCount: allMembers.filter((m) => m.listId === list.id).length,
    }));
  }

  async createList(input: ContactListInput): Promise<ActionResult & { id?: string }> {
    try {
      const db = await getLocalDb();
      const now = new Date().toISOString();
      const record = {
        id: crypto.randomUUID(),
        userId: LOCAL_USER_ID,
        name: input.name,
        description: input.description ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await db.add("contactLists", record);
      return { success: true, id: record.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create list" };
    }
  }

  async deleteList(id: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const tx = db.transaction(["contactLists", "contactListMembers"], "readwrite");
      await tx.objectStore("contactLists").delete(id);
      const memberStore = tx.objectStore("contactListMembers");
      const members = await memberStore.index("listId").getAll(id) as Array<{ listId: string; contactId: string }>;
      for (const m of members) {
        await memberStore.delete([m.listId, m.contactId]);
      }
      await tx.done;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete list" };
    }
  }

  async addToList(listId: string, contactIds: string[]): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      const tx = db.transaction("contactListMembers", "readwrite");
      for (const contactId of contactIds) {
        await tx.store.put({ listId, contactId, addedAt: new Date().toISOString() });
      }
      await tx.done;
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to add to list" };
    }
  }

  async removeFromList(listId: string, contactId: string): Promise<ActionResult> {
    try {
      const db = await getLocalDb();
      await db.delete("contactListMembers", [listId, contactId]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to remove from list" };
    }
  }

  async getListMembers(listId: string): Promise<ContactRecord[]> {
    const db = await getLocalDb();
    const members = (await db.getAllFromIndex("contactListMembers", "listId", listId)) as Array<{
      listId: string;
      contactId: string;
    }>;
    const contacts = await Promise.all(
      members.map((m) => db.get("contacts", m.contactId) as Promise<ContactRecord | undefined>),
    );
    return contacts.filter((c): c is ContactRecord => c !== undefined);
  }
}
