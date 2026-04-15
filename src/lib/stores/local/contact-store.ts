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
    try {
      const db = await getLocalDb();
      await db.delete("contacts", id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete contact" };
    }
  }

  async importContacts(contacts: ContactInput[]): Promise<{ imported: number; errors: string[] }> {
    const db = await getLocalDb();
    const errors: string[] = [];
    let imported = 0;

    for (const input of contacts) {
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
      } catch (error) {
        errors.push(
          `Row ${imported + errors.length + 1}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    return { imported, errors };
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
