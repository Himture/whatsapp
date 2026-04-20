import { getLocalDb } from "@/lib/stores/local/db";
import { encryptValue } from "@/lib/crypto";

const DEMO_FLAG_KEY = "demo-mode-active";

export function isDemoActive(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_FLAG_KEY) === "1";
}

function clearDemoFlag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DEMO_FLAG_KEY);
}

export async function seedDemoData(): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_FLAG_KEY, "1");

  const db = await getLocalDb();
  const now = new Date();
  const iso = (offsetMinutes: number) => new Date(now.getTime() - offsetMinutes * 60_000).toISOString();

  const configId = "demo-config-" + crypto.randomUUID();
  const existingConfigs = (await db.getAll("configs")) as Array<{ id: string }>;
  if (existingConfigs.length === 0) {
    await db.add("configs", {
      id: configId,
      name: "Demo Account",
      encryptedAccessToken: await encryptValue("demo-token"),
      phoneNumberId: "100000000000000",
      wabaId: "100000000000001",
      businessPortfolioId: null,
      apiVersion: "v24.0",
      isDefault: true,
      webhookVerifyToken: "demo-verify-token",
      encryptedAppSecret: null,
      appId: null,
      displayName: null,
      brandColor: null,
      createdAt: iso(60 * 24 * 30),
      updatedAt: iso(5),
    });
  }

  const contactsSeed = [
    ["Aarav Sharma", "+919876543210", "+919876543210", ["vip", "customer"]],
    ["Priya Patel", "+919988776655", "+919988776655", ["lead"]],
    ["Rohan Gupta", "+919811223344", "+919811223344", ["vip"]],
    ["Ananya Singh", "+919876501234", "+919876501234", ["customer"]],
    ["Vikram Rao", "+919900112233", "+919900112233", ["customer", "support"]],
  ] as const;

  const contactIds: string[] = [];
  for (const [i, [name, phone]] of contactsSeed.entries()) {
    const id = "demo-contact-" + i;
    contactIds.push(id);
    await db.put("contacts", {
      id,
      userId: "local",
      configId,
      name,
      phone,
      email: null,
      notes: null,
      tags: contactsSeed[i]?.[3] ?? [],
      optedOut: false,
      optedOutAt: null,
      waId: null,
      createdAt: iso(60 * 24 * (30 - i)),
      updatedAt: iso(60 * (20 - i)),
    });
  }

  const vipListId = "demo-list-vip";
  await db.put("contactLists", {
    id: vipListId,
    userId: "local",
    name: "VIP customers",
    description: "High-value accounts",
    createdAt: iso(60 * 24 * 14),
    updatedAt: iso(60 * 24 * 14),
  });

  for (const cid of [contactIds[0], contactIds[2]]) {
    if (!cid) continue;
    await db.put("contactListMembers", {
      listId: vipListId,
      contactId: cid,
      addedAt: iso(60 * 24 * 14),
    });
  }

  const incomingMessages: Array<{
    from: string;
    fromName: string;
    type: string;
    content: Record<string, unknown>;
    offsetMinutes: number;
  }> = [
    { from: "+919876543210", fromName: "Aarav Sharma", type: "text", content: { body: "Hi! Is my order shipped yet?" }, offsetMinutes: 180 },
    { from: "+919876543210", fromName: "Aarav Sharma", type: "text", content: { body: "Can you share a tracking link?" }, offsetMinutes: 120 },
    { from: "+919988776655", fromName: "Priya Patel", type: "text", content: { body: "Do you have the blue one in size M?" }, offsetMinutes: 45 },
    { from: "+919811223344", fromName: "Rohan Gupta", type: "text", content: { body: "Thanks, great service!" }, offsetMinutes: 15 },
    // Fresh thread — drives the "unread" wow moment when visitors first land in inbox.
    { from: "+919876501234", fromName: "Ananya Singh", type: "text", content: { body: "Hey, urgent — can someone call me back?" }, offsetMinutes: 3 },
  ];

  for (const [i, msg] of incomingMessages.entries()) {
    await db.put("receivedMessages", {
      id: "demo-msg-" + i,
      configId,
      waMessageId: "wamid.demo" + i,
      fromPhone: msg.from,
      fromName: msg.fromName,
      messageType: msg.type,
      content: msg.content,
      status: "received",
      timestamp: iso(msg.offsetMinutes),
      createdAt: iso(msg.offsetMinutes),
    });
  }

  const broadcastId = "demo-broadcast-1";
  await db.put("broadcasts", {
    id: broadcastId,
    userId: "local",
    configId,
    name: "Diwali promo — 20% off",
    status: "completed",
    messageType: "template",
    payload: { type: "template", template: { name: "diwali_offer_2026", language: { code: "en" } } },
    totalRecipients: 5,
    sentCount: 5,
    deliveredCount: 5,
    readCount: 4,
    failedCount: 0,
    rateLimitMs: 100,
    scheduledAt: null,
    startedAt: iso(60 * 24 * 2),
    completedAt: iso(60 * 24 * 2 - 1),
    createdAt: iso(60 * 24 * 2 + 10),
    updatedAt: iso(60 * 24 * 2 - 1),
  });

  for (const [i, cid] of contactIds.entries()) {
    await db.put("broadcastRecipients", {
      id: "demo-recipient-" + i,
      broadcastId,
      contactId: cid,
      phone: contactsSeed[i]?.[1] ?? "",
      name: contactsSeed[i]?.[0] ?? "",
      status: i === contactsSeed.length - 1 ? "delivered" : "read",
      waMessageId: "wamid.demo-bc-" + i,
      error: null,
      sentAt: iso(60 * 24 * 2 - i / 10),
      createdAt: iso(60 * 24 * 2),
    });
  }

  const statusSeed = [
    { status: "sent", count: 5 },
    { status: "delivered", count: 5 },
    { status: "read", count: 4 },
  ] as const;
  let statusIdx = 0;
  for (const s of statusSeed) {
    for (let i = 0; i < s.count; i++) {
      await db.put("messageStatuses", {
        id: "demo-status-" + statusIdx++,
        configId,
        waMessageId: "wamid.demo-bc-" + i,
        status: s.status,
        recipientPhone: contactsSeed[i]?.[1] ?? "",
        timestamp: iso(60 * 24 * 2 - i),
        error: null,
        createdAt: iso(60 * 24 * 2 - i),
      });
    }
  }

  // One pending scheduled message — visible on the schedule page, dashboard summary.
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(10, 0, 0, 0);
  await db.put("scheduledMessages", {
    id: "demo-scheduled-1",
    userId: "local",
    configId,
    name: "Festive sale reminder",
    payload: { to: "+919876543210", text: { body: "Last day to grab the festive offer — reply YES to claim." } },
    scheduledAt: tomorrow.toISOString(),
    status: "pending",
    waMessageId: null,
    error: null,
    processedAt: null,
    createdAt: iso(60),
  });

  const rulesSeed = [
    { name: "Welcome", trigger: "first_message", keywords: null, match: "contains", response: "Hi! Thanks for reaching out. We usually reply within 2 hours." },
    { name: "Pricing keywords", trigger: "keyword", keywords: ["price", "pricing", "cost"], match: "contains", response: "You can see our full pricing at /pricing. Anything specific I can help with?" },
    { name: "Greeting", trigger: "greeting", keywords: null, match: "contains", response: "Hey! How can I help today?" },
  ] as const;
  for (const [i, rule] of rulesSeed.entries()) {
    await db.put("autoReplyRules", {
      id: "demo-rule-" + i,
      userId: "local",
      configId,
      name: rule.name,
      enabled: true,
      triggerType: rule.trigger,
      keywords: rule.keywords,
      matchMode: rule.match,
      responseType: "text",
      responsePayload: { type: "text", text: { body: rule.response } },
      priority: i,
      createdAt: iso(60 * 24 * 10),
      updatedAt: iso(60 * 24 * 10),
    });
  }
}

export async function clearDemoData(): Promise<void> {
  if (typeof window === "undefined") return;
  clearDemoFlag();
  const db = await getLocalDb();
  const stores = [
    "configs", "contacts", "contactLists", "contactListMembers",
    "webhookEvents", "receivedMessages", "messageStatuses",
    "broadcasts", "broadcastRecipients", "scheduledMessages", "autoReplyRules",
  ] as const;
  for (const store of stores) {
    await db.clear(store);
  }
}
