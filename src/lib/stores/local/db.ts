"use client";

import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "whatsapp-api-manager";
// Bump version whenever new object stores are added; include all prior stores
// in upgrade() so fresh installs don't miss them.
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getLocalDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const configs = db.createObjectStore("configs", { keyPath: "id" });
          configs.createIndex("isDefault", "isDefault");
        }

        if (oldVersion < 2) {
          const contacts = db.createObjectStore("contacts", { keyPath: "id" });
          contacts.createIndex("phone", "phone");
          contacts.createIndex("configId", "configId");
          contacts.createIndex("userId", "userId");

          const lists = db.createObjectStore("contactLists", { keyPath: "id" });
          lists.createIndex("userId", "userId");

          const members = db.createObjectStore("contactListMembers", {
            keyPath: ["listId", "contactId"],
          });
          members.createIndex("listId", "listId");
          members.createIndex("contactId", "contactId");

          const webhookEvents = db.createObjectStore("webhookEvents", {
            keyPath: "id",
          });
          webhookEvents.createIndex("configId", "configId");
          webhookEvents.createIndex("eventType", "eventType");
          webhookEvents.createIndex("createdAt", "createdAt");

          const receivedMessages = db.createObjectStore("receivedMessages", {
            keyPath: "id",
          });
          receivedMessages.createIndex("configId", "configId");
          receivedMessages.createIndex("fromPhone", "fromPhone");
          receivedMessages.createIndex("waMessageId", "waMessageId", { unique: true });
          receivedMessages.createIndex("timestamp", "timestamp");

          const messageStatuses = db.createObjectStore("messageStatuses", {
            keyPath: "id",
          });
          messageStatuses.createIndex("configId", "configId");
          messageStatuses.createIndex("waMessageId", "waMessageId");

          const broadcasts = db.createObjectStore("broadcasts", { keyPath: "id" });
          broadcasts.createIndex("userId", "userId");
          broadcasts.createIndex("status", "status");

          const broadcastRecipients = db.createObjectStore("broadcastRecipients", {
            keyPath: "id",
          });
          broadcastRecipients.createIndex("broadcastId", "broadcastId");
          broadcastRecipients.createIndex("status", "status");

          const scheduled = db.createObjectStore("scheduledMessages", {
            keyPath: "id",
          });
          scheduled.createIndex("userId", "userId");
          scheduled.createIndex("status", "status");
          scheduled.createIndex("scheduledAt", "scheduledAt");

          const rules = db.createObjectStore("autoReplyRules", { keyPath: "id" });
          rules.createIndex("configId", "configId");
          rules.createIndex("priority", "priority");
        }
      },
    });
  }
  return dbPromise;
}
