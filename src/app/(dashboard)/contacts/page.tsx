"use client";

import { useState, useEffect, useCallback, useRef, useMemo, startTransition } from "react";
import { Search, Upload, Plus, Tag, Ban, Trash2, ListPlus, ListMinus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { notify } from "@/hooks/use-toast";
import { useSessionMode } from "@/lib/session-mode";
import { getContactStore } from "@/lib/stores";
import type { ContactRecord, ContactListRecord } from "@/lib/stores";
import { normPhone } from "@/lib/stores/local/contact-store";
import { parseCsv, sniffDelimiter } from "@/lib/csv";

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
  // Members are stored with the list id they belong to, so a list switch is
  // detectable in render (stale until the new load lands) without a synchronous
  // reset inside an effect.
  const [memberData, setMemberData] = useState<{ listId: string; ids: Set<string> } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showListForm, setShowListForm] = useState(false);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [importListId, setImportListId] = useState("");
  const [importNewList, setImportNewList] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkListId, setBulkListId] = useState("");
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [fname, setFname] = useState("");
  const [fphone, setFphone] = useState("");
  const [femail, setFemail] = useState("");
  const [fnotes, setFnotes] = useState("");
  const [ftags, setFtags] = useState("");
  const [saving, setSaving] = useState(false);

  const [listName, setListName] = useState("");

  // Refresh the set of member ids for the selected list. Called on select and
  // after mutations (remove-from-list) so the filtered view stays accurate.
  const refreshMembers = useCallback(async () => {
    if (!selectedListId) { setMemberData(null); return; }
    const store = getContactStore(storeMode);
    const members = await store.getListMembers(selectedListId);
    setMemberData({ listId: selectedListId, ids: new Set(members.map((m) => m.id)) });
  }, [selectedListId, storeMode]);

  // Load member ids whenever a list is selected. memberData records which list
  // the ids belong to, so the filter can tell "still loading the new list" from
  // "loaded and empty" without a synchronous reset in the effect body.
  useEffect(() => {
    if (!selectedListId) return;
    let cancelled = false;
    (async () => {
      const store = getContactStore(storeMode);
      const members = await store.getListMembers(selectedListId);
      if (!cancelled) setMemberData({ listId: selectedListId, ids: new Set(members.map((m) => m.id)) });
    })();
    return () => { cancelled = true; };
  }, [selectedListId, storeMode]);

  // Selecting a list (or changing the search) also clears bulk selection so a
  // bulk Delete/Remove can never act on rows that aren't currently visible.
  function selectList(id: string | null) {
    setSelectedListId(id);
    setSelectedIds(new Set());
  }
  function changeSearch(value: string) {
    setSearch(value);
    setSelectedIds(new Set());
  }

  // A list is selected but its members for THAT list haven't loaded yet — show
  // nothing rather than every contact (or the previous list's members).
  const members = memberData && memberData.listId === selectedListId ? memberData.ids : null;
  const membersLoading = selectedListId !== null && members === null;

  const filtered = useMemo(() => {
    if (membersLoading) return [];
    const term = search.toLowerCase();
    const phoneTerm = normPhone(search);
    return contacts.filter((c) => {
      if (selectedListId && members && !members.has(c.id)) return false;
      if (!term) return true;
      return (
        c.name.toLowerCase().includes(term) ||
        normPhone(c.phone).includes(phoneTerm)
      );
    });
  }, [contacts, search, members, selectedListId, membersLoading]);

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
      if (selectedListId === deleteListId) selectList(null);
      notify.success("List deleted"); void reload();
    } else notify.error(result.error ?? "Failed");
    setDeleteListId(null);
  }

  async function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();

    // Sniff the delimiter from the first non-empty header line, then parse the
    // whole file with a proper RFC-4180 tokenizer (quoted fields, embedded
    // commas/newlines, escaped quotes, CRLF, BOM all handled).
    const firstLine = text.replace(/^﻿/, "").split(/\r\n|\r|\n/).find((l) => l.trim()) ?? "";
    const delimiter = sniffDelimiter(firstLine);
    const rows = parseCsv(text, delimiter).filter((r) => r.some((cell) => cell.trim()));
    if (rows.length < 2) { notify.error("CSV must have a header row and at least one contact"); return; }

    const headers = (rows[0] ?? []).map((h) => h.trim().toLowerCase());

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

    const toImport = rows.slice(1).map((cols) => {
      return {
        name: (cols[nameIdx] ?? "").trim(),
        phone: (cols[phoneIdx] ?? "").trim(),
        email: emailIdx >= 0 ? (cols[emailIdx]?.trim() || undefined) : undefined,
        notes: notesIdx >= 0 ? (cols[notesIdx]?.trim() || undefined) : undefined,
        tags: (tagsIdx >= 0 && cols[tagsIdx]?.trim()) ? (cols[tagsIdx] as string).split(";").map((t) => t.trim()).filter(Boolean) : [],
      };
    }).filter((c) => c.name && c.phone);

    const store = getContactStore(storeMode);

    // Resolve the target list: a typed new-list name takes precedence over the
    // dropdown selection. Empty → import into "All contacts" (no list).
    let listId: string | undefined = importListId || undefined;
    let listLabel = lists.find((l) => l.id === importListId)?.name;
    const newName = importNewList.trim();
    if (newName) {
      const created = await store.createList({ name: newName });
      if (!created.success || !created.id) { notify.error(created.error ?? "Failed to create list"); return; }
      listId = created.id;
      listLabel = newName;
    }

    const result = await store.importContacts(toImport, { listId });
    const parts = [`Imported ${result.imported}`];
    if (result.skipped) parts.push(`skipped ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"}`);
    if (result.errors.length) parts.push(`${result.errors.length} failed`);
    notify.success(parts.join(", ") + (listId && listLabel ? ` → ${listLabel}` : ""));
    if (fileRef.current) fileRef.current.value = "";
    setShowImport(false);
    setImportListId(""); setImportNewList("");
    void reload();
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkAddToList(listId: string) {
    if (!listId || selectedIds.size === 0) return;
    const store = getContactStore(storeMode);
    const result = await store.addToList(listId, [...selectedIds]);
    if (result.success) {
      const name = lists.find((l) => l.id === listId)?.name ?? "list";
      notify.success(`Added ${selectedIds.size} contact${selectedIds.size === 1 ? "" : "s"} to ${name}`);
      setSelectedIds(new Set());
      setBulkListId("");
      void reload();
    } else notify.error(result.error ?? "Failed to add to list");
  }

  async function handleRemoveFromList(contactId: string) {
    if (!selectedListId) return;
    const store = getContactStore(storeMode);
    const result = await store.removeFromList(selectedListId, contactId);
    if (result.success) {
      notify.success("Removed from list");
      await refreshMembers();
      void reload();
    } else notify.error(result.error ?? "Failed to remove from list");
  }

  async function handleBulkRemoveFromList() {
    if (!selectedListId || selectedIds.size === 0) return;
    const store = getContactStore(storeMode);
    let removed = 0;
    for (const id of selectedIds) {
      const r = await store.removeFromList(selectedListId, id);
      if (r.success) removed++;
    }
    const name = lists.find((l) => l.id === selectedListId)?.name ?? "list";
    notify.success(`Removed ${removed} contact${removed === 1 ? "" : "s"} from ${name}`);
    setSelectedIds(new Set());
    await refreshMembers();
    void reload();
  }

  async function handleConfirmBulkDelete() {
    const store = getContactStore(storeMode);
    const result = await store.deleteContacts([...selectedIds]);
    if (result.success) {
      notify.success(`Deleted ${result.deleted} contact${result.deleted === 1 ? "" : "s"}`);
      setSelectedIds(new Set());
      void reload();
    } else notify.error(result.error ?? "Failed to delete");
    setShowBulkDelete(false);
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
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-4">
              <div className="sm:w-56">
                <Dropdown
                  label="Add imported contacts to list"
                  options={[{ label: "— No list —", value: "" }, ...lists.map((l) => ({ label: l.name, value: l.id }))]}
                  value={importListId}
                  onChange={(v) => { setImportListId(v); if (v) setImportNewList(""); }}
                  placeholder="— No list —"
                />
              </div>
              <div className="sm:w-56">
                <Input
                  label="or new list name"
                  value={importNewList}
                  onChange={(e) => { setImportNewList(e.target.value); if (e.target.value) setImportListId(""); }}
                  placeholder="e.g. Newsletter"
                />
              </div>
            </div>
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
                onClick={() => selectList(null)}
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
                  onClick={() => selectList(list.id === selectedListId ? null : list.id)}
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
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search by name or phone…"
              aria-label="Search contacts"
              className="w-full pl-9 pr-4 py-2 rounded-[var(--radius-micro)] border border-input-border bg-white text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
            />
          </div>

          {selectedIds.size > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[var(--radius-micro)] border border-notion-blue/30 bg-notion-blue/5 px-3 py-2">
              <span className="text-sm font-medium text-near-black">{selectedIds.size} selected</span>
              <div className="w-44">
                <Dropdown
                  options={[{ label: "Add to list…", value: "" }, ...lists.map((l) => ({ label: l.name, value: l.id }))]}
                  value={bulkListId}
                  onChange={(v) => { if (v) void handleBulkAddToList(v); }}
                  placeholder="Add to list…"
                />
              </div>
              {selectedListId && (
                <Button variant="secondary" size="sm" onClick={() => void handleBulkRemoveFromList()}>
                  <ListMinus className="size-4" /> Remove from list
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowBulkDelete(true)}>
                <Trash2 className="size-4" /> Delete contact{selectedIds.size === 1 ? "" : "s"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </div>
          )}

          {filtered.length === 0 ? (
            <Card className="bg-warm-white border-none">
              <CardContent className="py-10 text-center text-sm text-warm-500">
                {membersLoading
                  ? "Loading list…"
                  : search
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
                    <th className="w-10 px-4 py-2.5 text-left">
                      <input
                        type="checkbox"
                        className="rounded align-middle"
                        aria-label="Select all contacts"
                        checked={filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))}
                        ref={(el) => {
                          if (el) el.indeterminate = filtered.some((c) => selectedIds.has(c.id)) && !filtered.every((c) => selectedIds.has(c.id));
                        }}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) filtered.forEach((c) => next.add(c.id));
                            else filtered.forEach((c) => next.delete(c.id));
                            return next;
                          });
                        }}
                      />
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500">Name</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500">Phone</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500 hidden md:table-cell">Tags</th>
                    <th className="px-4 py-2.5 text-left font-medium text-warm-500 hidden lg:table-cell">Status</th>
                    <th className="px-4 py-2.5 text-right font-medium text-warm-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 bg-white">
                  {filtered.map((contact) => (
                    <tr key={contact.id} className={`transition-colors ${selectedIds.has(contact.id) ? "bg-notion-blue/5" : "hover:bg-warm-white/60"}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="rounded align-middle"
                          aria-label={`Select ${contact.name}`}
                          checked={selectedIds.has(contact.id)}
                          onChange={() => toggleSelected(contact.id)}
                        />
                      </td>
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
                          {selectedListId && (
                            <button
                              type="button"
                              onClick={() => void handleRemoveFromList(contact.id)}
                              aria-label={`Remove ${contact.name} from this list`}
                              title="Remove from this list"
                              className="p-1.5 rounded text-warm-500 hover:text-near-black transition-colors"
                            >
                              <ListMinus className="size-3.5" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteContactId(contact.id)}
                            aria-label={`Delete ${contact.name}`}
                            title="Delete contact everywhere"
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
        open={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedIds.size} contact${selectedIds.size === 1 ? "" : "s"}?`}
        description="This permanently removes the selected contacts and any list memberships. The action cannot be undone."
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
