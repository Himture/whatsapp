"use client";

import {
  getContacts as serverGetContacts,
  createContact as serverCreateContact,
  updateContact as serverUpdateContact,
  deleteContact as serverDeleteContact,
  setContactOptOut as serverSetContactOptOut,
  getContactLists as serverGetContactLists,
  createContactList as serverCreateContactList,
  deleteContactList as serverDeleteContactList,
  addContactsToList as serverAddContactsToList,
  removeContactFromList as serverRemoveContactFromList,
  getListMembers as serverGetListMembers,
} from "@/app/(dashboard)/contacts/actions";
import { normPhone } from "../local/contact-store";
import type {
  ContactStore,
  ContactRecord,
  ContactInput,
  ContactListRecord,
  ContactListInput,
  ActionResult,
} from "../types";

// Mirror of local/contact-store's normEmail: only a well-formed address is a
// dedup key; blanks/placeholders collapse to "" so they never trigger a false skip.
function normEmail(email: string | null | undefined): string {
  const e = (email ?? "").trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) ? e : "";
}

export class RemoteContactStore implements ContactStore {
  async getContacts(configId?: string): Promise<ContactRecord[]> {
    return serverGetContacts(configId);
  }

  async getContact(id: string): Promise<ContactRecord | null> {
    // No dedicated server action — find within the user's contacts.
    const all = await serverGetContacts();
    return all.find((c) => c.id === id) ?? null;
  }

  async createContact(input: ContactInput): Promise<ActionResult & { id?: string }> {
    return serverCreateContact(input);
  }

  async updateContact(id: string, input: Partial<ContactInput>): Promise<ActionResult> {
    return serverUpdateContact(id, input);
  }

  async deleteContact(id: string): Promise<ActionResult> {
    return serverDeleteContact(id);
  }

  async deleteContacts(ids: string[]): Promise<ActionResult & { deleted: number }> {
    // The Postgres schema cascades list memberships on contact delete, so a plain
    // loop over deleteContact is sufficient.
    let deleted = 0;
    for (const id of ids) {
      const result = await serverDeleteContact(id);
      if (!result.success) {
        return { success: false, deleted, error: result.error };
      }
      deleted++;
    }
    return { success: true, deleted };
  }

  async importContacts(
    contacts: ContactInput[],
    options?: { listId?: string },
  ): Promise<{ imported: number; skipped: number; errors: string[]; contactIds: string[] }> {
    const errors: string[] = [];
    const contactIds: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Dedup against existing contacts by normalized phone / valid email, and
    // against rows already created earlier in this same import.
    const existing = await serverGetContacts();
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
        skipped++;
        contactIds.push(match);
        continue;
      }

      const result = await serverCreateContact(input);
      if (result.success && result.id) {
        imported++;
        contactIds.push(result.id);
        byPhone.set(phoneKey, result.id);
        if (emailKey) byEmail.set(emailKey, result.id);
      } else {
        errors.push(
          `Row ${imported + skipped + errors.length + 1}: ${result.error ?? "Unknown error"}`,
        );
      }
    }

    if (options?.listId && contactIds.length > 0) {
      await serverAddContactsToList(options.listId, contactIds);
    }

    return { imported, skipped, errors, contactIds };
  }

  async setOptOut(id: string, optedOut: boolean): Promise<ActionResult> {
    return serverSetContactOptOut(id, optedOut);
  }

  async getLists(): Promise<ContactListRecord[]> {
    return serverGetContactLists();
  }

  async createList(input: ContactListInput): Promise<ActionResult & { id?: string }> {
    return serverCreateContactList(input);
  }

  async deleteList(id: string): Promise<ActionResult> {
    return serverDeleteContactList(id);
  }

  async addToList(listId: string, contactIds: string[]): Promise<ActionResult> {
    return serverAddContactsToList(listId, contactIds);
  }

  async removeFromList(listId: string, contactId: string): Promise<ActionResult> {
    return serverRemoveContactFromList(listId, contactId);
  }

  async getListMembers(listId: string): Promise<ContactRecord[]> {
    return serverGetListMembers(listId);
  }
}
