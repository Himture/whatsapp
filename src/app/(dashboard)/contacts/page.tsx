"use client";

import { useState, useEffect, useCallback, useRef, useMemo, startTransition } from "react";
import { Search, Upload, Plus, Tag, Ban, Trash2, ListPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { getContactStore } from "@/lib/stores";
import type { ContactRecord, ContactListRecord } from "@/lib/stores";

function useContacts() {
  const { mode } = useSessionMode();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [lists, setLists] = useState<ContactListRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (mode === "loading") return;
    const store = getContactStore(storeMode);
    const [c, l] = await Promise.all([store.getContacts(), store.getLists()]);
    setContacts(c);
    setLists(l);
    setLoading(false);
  }, [mode, storeMode]);

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  return { contacts, lists, loading, reload: load, storeMode };
}

export default function ContactsPage() {
  const { contacts, lists, loading, reload, storeMode } = useContacts();
  const [search, setSearch] = useState("");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fname, setFname] = useState("");
  const [fphone, setFphone] = useState("");
  const [femail, setFemail] = useState("");
  const [fnotes, setFnotes] = useState("");
  const [ftags, setFtags] = useState("");
  const [saving, setSaving] = useState(false);

  const [listName, setListName] = useState("");

  // Load member ids whenever a list is selected. The filter below bypasses
  // memberIds when no list is selected, so a stale set after deselect is harmless.
  useEffect(() => {
    if (!selectedListId) return;
    let cancelled = false;
    (async () => {
      const store = getContactStore(storeMode);
      const members = await store.getListMembers(selectedListId);
      if (!cancelled) setMemberIds(new Set(members.map((m) => m.id)));
    })();
    return () => { cancelled = true; };
  }, [selectedListId, storeMode]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return contacts.filter((c) => {
      if (selectedListId && memberIds && !memberIds.has(c.id)) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        c.phone.includes(search)
      );
    });
  }, [contacts, search, memberIds, selectedListId]);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const store = getContactStore(storeMode);
    const result = await store.createContact({
      name: fname, phone: fphone,
      email: femail || undefined, notes: fnotes || undefined,
      tags: ftags ? ftags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    });
    setSaving(false);
    if (result.success) {
      setShowForm(false);
      setFname(""); setFphone(""); setFemail(""); setFnotes(""); setFtags("");
      notify.success("Contact added");
      void reload();
    } else {
      notify.error(result.error ?? "Failed to create contact");
    }
  }

  async function handleConfirmDeleteContact() {
    if (!deleteContactId) return;
    const store = getContactStore(storeMode);
    const result = await store.deleteContact(deleteContactId);
    if (result.success) { notify.success("Contact deleted"); void reload(); }
    else notify.error(result.error ?? "Failed to delete");
    setDeleteContactId(null);
  }

  async function handleOptOut(id: string, current: boolean) {
    const store = getContactStore(storeMode);
    const result = await store.setOptOut(id, !current);
    if (result.success) { notify.success(!current ? "Contact opted out" : "Opt-out removed"); void reload(); }
    else notify.error(result.error ?? "Failed");
  }

  async function handleCreateList(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const store = getContactStore(storeMode);
    const result = await store.createList({ name: listName });
    if (result.success) {
      setShowListForm(false); setListName("");
      notify.success("List created"); void reload();
    } else notify.error(result.error ?? "Failed");
  }

  async function handleConfirmDeleteList() {
    if (!deleteListId) return;
    const store = getContactStore(storeMode);
    const result = await store.deleteList(deleteListId);
    if (result.success) {
      if (selectedListId === deleteListId) setSelectedListId(null);
      notify.success("List deleted"); void reload();
    } else notify.error(result.error ?? "Failed");
    setDeleteListId(null);
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) { notify.error("CSV must have a header row and at least one contact"); return; }

    const headerLine = lines[0] ?? "";
    const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    let nameIdx = -1, phoneIdx = -1, emailIdx = -1, notesIdx = -1, tagsIdx = -1;
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i] ?? "";
      if (nameIdx === -1 && h.includes("name")) nameIdx = i;
      else if (phoneIdx === -1 && (h.includes("phone") || h.includes("number") || h.includes("mobile"))) phoneIdx = i;
      else if (emailIdx === -1 && h.includes("email")) emailIdx = i;
      else if (notesIdx === -1 && (h.includes("notes") || h.includes("note"))) notesIdx = i;
      else if (tagsIdx === -1 && (h.includes("tags") || h.includes("tag"))) tagsIdx = i;
    }

    if (nameIdx === -1 || phoneIdx === -1) {
      notify.error("CSV must have columns named 'name' and 'phone' (or 'number'/'mobile')");
      return;
    }

    const toImport = lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        name: cols[nameIdx] ?? "",
        phone: cols[phoneIdx] ?? "",
        email: emailIdx >= 0 ? (cols[emailIdx] || undefined) : undefined,
        notes: notesIdx >= 0 ? (cols[notesIdx] || undefined) : undefined,
        tags: (tagsIdx >= 0 && cols[tagsIdx]) ? (cols[tagsIdx] as string).split(";").map((t) => t.trim()) : [],
      };
    }).filter((c) => c.name && c.phone);

    const store = getContactStore(storeMode);
    const result = await store.importContacts(toImport);
    notify.success(`Imported ${result.imported} contacts${result.errors.length ? `. ${result.errors.length} failed.` : ""}`);
    if (fileRef.current) fileRef.current.value = "";
    setShowImport(false);
    void reload();
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">Contacts</h1>
          <p className="mt-1 text-sm text-warm-500">{contacts.length} total · {contacts.filter((c) => c.optedOut).length} opted out</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(!showImport)}>
            <Upload className="size-4" /> Import CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowListForm(!showListForm)}>
            <ListPlus className="size-4" /> New List
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" /> Add Contact
          </Button>
        </div>
      </div>

      {showImport && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-warm-500 mb-3">
              CSV must include <code className="bg-warm-100 px-1 rounded text-xs">name</code> and <code className="bg-warm-100 px-1 rounded text-xs">phone</code> columns. Optional: <code className="bg-warm-100 px-1 rounded text-xs">email</code>, <code className="bg-warm-100 px-1 rounded text-xs">notes</code>, <code className="bg-warm-100 px-1 rounded text-xs">tags</code> (semicolon-separated).
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCSVImport} className="text-sm" aria-label="Upload CSV file" />
          </CardContent>
        </Card>
      )}

      {showListForm && (
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <form onSubmit={handleCreateList} className="flex gap-2 items-end flex-wrap">
              <Input label="List name" value={listName} onChange={(e) => setListName(e.target.value)} placeholder="e.g. VIP Customers" required />
              <Button type="submit" size="sm">Create</Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowListForm(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Name" value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Full name" required />
              <Input label="Phone (E.164)" value={fphone} onChange={(e) => setFphone(e.target.value)} placeholder="+15551234567" required />
              <Input label="Email" value={femail} onChange={(e) => setFemail(e.target.value)} placeholder="optional" />
              <Input label="Tags (comma-separated)" value={ftags} onChange={(e) => setFtags(e.target.value)} placeholder="vip, lead" />
              <div className="sm:col-span-2">
                <Input label="Notes" value={fnotes} onChange={(e) => setFnotes(e.target.value)} placeholder="Optional notes" />
              </div>
              <div className="sm:col-span-2 flex gap-2 mt-1">
                <Button type="submit" loading={saving}>Save</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <aside className="w-full md:w-48 md:shrink-0">
          <p className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-2 px-2">Lists</p>
          <ul className="flex md:flex-col gap-0.5 overflow-x-auto md:overflow-visible">
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setSelectedListId(null)}
                className={`w-full text-left px-3 py-1.5 rounded-[var(--radius-micro)] text-sm whitespace-nowrap ${!selectedListId ? "bg-white shadow-card text-near-black" : "text-warm-500 hover:text-near-black"}`}
              >
                All contacts
                <span className="ml-1.5 text-xs text-warm-500">({contacts.length})</span>
              </button>
            </li>
            {lists.map((list) => (
              <li key={list.id} className="flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedListId(list.id === selectedListId ? null : list.id)}
                  className={`flex-1 text-left px-3 py-1.5 rounded-[var(--radius-micro)] text-sm truncate whitespace-nowrap ${list.id === selectedListId ? "bg-white shadow-card text-near-black" : "text-warm-500 hover:text-near-black"}`}
                >
                  {list.name}
                  <span className="ml-1.5 text-xs text-warm-500">({list.memberCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteListId(list.id)}
                  className="md:opacity-0 md:group-hover:opacity-100 p-1 text-warm-500 hover:text-danger transition-opacity"
                  aria-label={`Delete list ${list.name}`}
                >
                  <X className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-3 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-warm-500" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone…"
              aria-label="Search contacts"
              className="w-full pl-9 pr-4 py-2 rounded-[var(--radius-micro)] border border-input-border bg-white text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="bg-warm-white border-none">
              <CardContent className="py-10 text-center text-sm text-warm-500">
                {search
                  ? "No contacts match your search."
                  : selectedListId
                  ? "This list has no contacts yet. Add some from the All contacts view."
                  : "No contacts yet. Add one above or import a CSV."}
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-[var(--radius-subtle)] border border-black/10 overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-warm-white border-b border-black/10">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500">Phone</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500 hidden md:table-cell">Tags</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500 hidden lg:table-cell">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-warm-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 bg-white">
                  {filtered.map((contact) => (
                    <tr key={contact.id} className="hover:bg-warm-white/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-near-black">{contact.name}</td>
                      <td className="px-4 py-3 text-warm-500 font-mono text-xs">{contact.phone}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-warm-100 px-2 py-0.5 text-xs text-warm-600">
                              <Tag className="size-2.5" aria-hidden="true" />{tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {contact.optedOut ? (
                          <Badge variant="danger">Opted out</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOptOut(contact.id, contact.optedOut)}
                            aria-label={contact.optedOut ? `Remove opt-out for ${contact.name}` : `Mark ${contact.name} as opted out`}
                            className="p-1.5 rounded text-warm-500 hover:text-near-black transition-colors"
                          >
                            <Ban className="size-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteContactId(contact.id)}
                            aria-label={`Delete ${contact.name}`}
                            className="p-1.5 rounded text-warm-500 hover:text-danger transition-colors"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteContactId !== null}
        onClose={() => setDeleteContactId(null)}
        onConfirm={handleConfirmDeleteContact}
        title="Delete contact?"
        description="This permanently removes the contact and any list memberships. The action cannot be undone."
        confirmLabel="Delete"
        destructive
      />
      <ConfirmDialog
        open={deleteListId !== null}
        onClose={() => setDeleteListId(null)}
        onConfirm={handleConfirmDeleteList}
        title="Delete list?"
        description="The list and its memberships are removed. The contacts themselves stay intact."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
