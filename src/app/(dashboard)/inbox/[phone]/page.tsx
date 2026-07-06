"use client";

import { useState, useCallback, useEffect, startTransition, useRef, useOptimistic } from "react";
import { use } from "react";
import { ChevronLeft, Image as ImageIcon, FileText, MapPin, Phone, Headphones, Sticker, SmilePlus } from "lucide-react";
import Link from "next/link";
import { useSessionMode } from "@/lib/session-mode";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { getInboxStore } from "@/lib/stores";
import { messagesApi, parseGraphError } from "@/lib/whatsapp";
import { notify } from "@/hooks/use-toast";
import type { ReceivedMessageRecord } from "@/lib/stores";
import { ROUTES } from "@/lib/constants";
import { InboxComposer } from "@/components/whatsapp/inbox-composer";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

const TYPE_ICON: Record<string, React.ReactNode> = {
  image: <ImageIcon className="size-3.5" aria-hidden="true" />,
  document: <FileText className="size-3.5" aria-hidden="true" />,
  location: <MapPin className="size-3.5" aria-hidden="true" />,
  contacts: <Phone className="size-3.5" aria-hidden="true" />,
  audio: <Headphones className="size-3.5" aria-hidden="true" />,
  sticker: <Sticker className="size-3.5" aria-hidden="true" />,
};

interface OutgoingMessage {
  id: string;
  body: string;
  timestamp: string;
  status: "sending" | "sent" | "failed";
}

function OutgoingBubble({ msg }: { msg: OutgoingMessage }) {
  return (
    <div className="flex flex-col max-w-[75%] ml-auto items-end">
      <div className={`rounded-[var(--radius-subtle)] rounded-tr-none px-3 py-2 shadow-card ${msg.status === "failed" ? "bg-red-50 border border-red-200" : "bg-notion-blue text-white"}`}>
        <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
      </div>
      <span className={`text-[10px] mt-1 mr-1 ${msg.status === "failed" ? "text-danger" : "text-warm-500"}`}>
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {msg.status === "sending" ? " · Sending…" : null}
        {msg.status === "failed" ? " · Failed" : null}
      </span>
    </div>
  );
}

function MessageBubble({ msg, onReact }: { msg: ReceivedMessageRecord; onReact: (waMessageId: string, emoji: string) => void }) {
  const content = msg.content as Record<string, unknown>;
  const [pickerOpen, setPickerOpen] = useState(false);

  function renderContent() {
    switch (msg.messageType) {
      case "text": return <p className="whitespace-pre-wrap text-sm">{(content.body as string) ?? ""}</p>;
      case "image": return <div className="flex items-center gap-1.5 text-sm text-warm-500">{TYPE_ICON.image} Image{content.caption ? `: ${content.caption as string}` : ""}</div>;
      case "document": return <div className="flex items-center gap-1.5 text-sm text-warm-500">{TYPE_ICON.document} {(content.filename as string) ?? "Document"}</div>;
      case "audio": return <div className="flex items-center gap-1.5 text-sm text-warm-500">{TYPE_ICON.audio} Voice message</div>;
      case "location": return <div className="text-sm text-warm-500"><MapPin className="size-3.5 inline mr-1" />{(content.name as string) ?? `${String(content.latitude)}, ${String(content.longitude)}`}</div>;
      case "sticker": return <div className="flex items-center gap-1.5 text-sm text-warm-500">{TYPE_ICON.sticker} Sticker</div>;
      case "interactive": {
        const reply = content.button_reply as { title?: string } | undefined;
        const listReply = content.list_reply as { title?: string } | undefined;
        return <p className="text-sm">{reply?.title ?? listReply?.title ?? "Interactive response"}</p>;
      }
      case "button": return <p className="text-sm font-medium">{(content.text as string) ?? "Button"}</p>;
      default: return <p className="text-xs text-warm-500">[{msg.messageType}]</p>;
    }
  }

  return (
    <div className="group flex flex-col max-w-[75%]">
      <div className="flex items-center gap-1.5">
        <div className="bg-white rounded-[var(--radius-subtle)] rounded-tl-none px-3 py-2 shadow-card border border-black/5">
          {renderContent()}
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setPickerOpen((o) => !o)}
            aria-label="React to message"
            className="inline-flex size-6 items-center justify-center rounded-full text-warm-500 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-warm-100 hover:text-near-black transition-opacity focus-visible:ring-2 focus-visible:ring-focus-blue"
          >
            <SmilePlus className="size-3.5" aria-hidden="true" />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 bottom-full z-10 mb-1 flex gap-0.5 rounded-full border border-black/10 bg-white px-1.5 py-1 shadow-card">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onReact(msg.waMessageId, emoji); setPickerOpen(false); }}
                  className="inline-flex size-7 items-center justify-center rounded-full text-base hover:bg-warm-100 transition-colors"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <span className="text-[10px] text-warm-500 mt-1 ml-1">
        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        {msg.status === "read" && " · Read"}
      </span>
    </div>
  );
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone: encodedPhone } = use(params);
  const phone = decodeURIComponent(encodedPhone);

  const { mode } = useSessionMode();
  const { activeConfig, activeConfigId } = useWhatsAppConfig();
  const storeMode = mode === "authenticated" ? "remote" as const : "local" as const;

  const [messages, setMessages] = useState<ReceivedMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [outgoing, setOutgoing] = useState<OutgoingMessage[]>([]);
  const [optimisticOutgoing, addOptimisticOutgoing] = useOptimistic(
    outgoing,
    (state, next: OutgoingMessage) => [...state, next],
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  // Tracks waMessageIds we've already sent a WhatsApp read receipt for, so a
  // reload never re-POSTs `markAsRead` for the same inbound message.
  const readReceiptSent = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (mode === "loading" || !activeConfigId) return;
    const store = getInboxStore(storeMode);
    const data = await store.getMessages(activeConfigId, phone);
    setMessages(data);
    setLoading(false);
    if (data.length > 0) void store.markThreadRead(activeConfigId, phone);

    // Send WhatsApp read receipts (fire-and-forget) for inbound messages that
    // are still unread and haven't already been acked this session.
    if (activeConfig) {
      const unread = data.filter(
        (m) => m.status === "received" && m.waMessageId && !readReceiptSent.current.has(m.waMessageId),
      );
      for (const m of unread) {
        readReceiptSent.current.add(m.waMessageId);
        void messagesApi.markAsRead(activeConfig, m.waMessageId);
      }
    }
  }, [mode, storeMode, activeConfigId, activeConfig, phone]);

  const handleReact = useCallback(
    (waMessageId: string, emoji: string) => {
      if (!activeConfig) return;
      startTransition(async () => {
        const result = await messagesApi.sendReaction(activeConfig, phone, waMessageId, emoji);
        if (result.ok) notify.success(`Reacted ${emoji}`);
        else notify.error(parseGraphError(result.data, "Failed to send reaction"));
      });
    },
    [activeConfig, phone],
  );

  useEffect(() => {
    startTransition(() => { void load(); });
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-black/10 mb-0">
        <Link
          href={ROUTES.INBOX}
          aria-label="Back to inbox"
          className="-ml-2 inline-flex size-10 items-center justify-center rounded-[var(--radius-micro)] text-warm-500 hover:text-near-black hover:bg-warm-100 transition-colors focus-visible:ring-2 focus-visible:ring-focus-blue"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="size-8 rounded-full bg-warm-100 flex items-center justify-center text-sm font-medium text-warm-600" aria-hidden="true">
          {phone.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-near-black text-sm leading-none">{messages[0]?.fromName ?? phone}</p>
          <p className="text-xs text-warm-500 mt-0.5">{phone}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="size-5 animate-spin rounded-full border-2 border-notion-blue border-t-transparent" />
          </div>
        ) : messages.length === 0 && optimisticOutgoing.length === 0 ? (
          <p className="text-center text-sm text-warm-500 py-10">No messages yet.</p>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="flex justify-start">
                <MessageBubble msg={msg} onReact={handleReact} />
              </div>
            ))}
            {optimisticOutgoing.map((msg) => (
              <div key={msg.id} className="flex">
                <OutgoingBubble msg={msg} />
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      {activeConfig && (
        <InboxComposer
          config={activeConfig}
          phone={phone}
          onOptimistic={addOptimisticOutgoing}
          onSettle={(msg) => setOutgoing((prev) => [...prev, msg])}
          onSent={() => { void load(); }}
        />
      )}
    </div>
  );
}
