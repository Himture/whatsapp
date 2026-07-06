"use client";

import { useState, startTransition } from "react";
import { Send, Type, Image as ImageIcon, MapPin, MessageSquare } from "lucide-react";
import { MediaField } from "@/components/whatsapp/media-field";
import { messagesApi, parseGraphError } from "@/lib/whatsapp";
import { notify } from "@/hooks/use-toast";
import type { WhatsAppClientConfig } from "@/lib/types";

type ComposerType = "text" | "media" | "location" | "buttons";

const TABS: Array<{ id: ComposerType; label: string; icon: React.ReactNode }> = [
  { id: "text", label: "Text", icon: <Type className="size-3.5" aria-hidden="true" /> },
  { id: "media", label: "Media", icon: <ImageIcon className="size-3.5" aria-hidden="true" /> },
  { id: "location", label: "Location", icon: <MapPin className="size-3.5" aria-hidden="true" /> },
  { id: "buttons", label: "Buttons", icon: <MessageSquare className="size-3.5" aria-hidden="true" /> },
];

const MEDIA_KINDS = ["image", "video", "document", "audio", "sticker"] as const;
type MediaKindOption = (typeof MEDIA_KINDS)[number];

interface OutgoingMessage {
  id: string;
  body: string;
  timestamp: string;
  status: "sending" | "sent" | "failed";
}

// The inbox composer: a message-type switcher wrapping every send path the
// conversation supports. Text sends stay optimistic (the page renders the
// pending bubble); richer types just fire and reload the thread on success.
export function InboxComposer({
  config,
  phone,
  onOptimistic,
  onSettle,
  onSent,
}: {
  config: WhatsAppClientConfig;
  phone: string;
  onOptimistic: (msg: OutgoingMessage) => void;
  onSettle: (msg: OutgoingMessage) => void;
  onSent: () => void;
}) {
  const [type, setType] = useState<ComposerType>("text");
  const [busy, setBusy] = useState(false);

  // Text
  const [replyText, setReplyText] = useState("");

  // Media
  const [mediaKind, setMediaKind] = useState<MediaKindOption>("image");
  const [mediaSource, setMediaSource] = useState("");
  const [mediaCaption, setMediaCaption] = useState("");
  const [mediaFilename, setMediaFilename] = useState("");

  // Location
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locName, setLocName] = useState("");
  const [locAddress, setLocAddress] = useState("");

  // Interactive buttons
  const [bodyText, setBodyText] = useState("");
  const [buttons, setButtons] = useState<string[]>(["", "", ""]);

  const inputClass =
    "w-full rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20";

  function handleText() {
    const body = replyText.trim();
    if (!body) return;
    const tempId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    setReplyText("");
    startTransition(async () => {
      onOptimistic({ id: tempId, body, timestamp, status: "sending" });
      const result = await messagesApi.sendText(config, phone, body);
      onSettle({ id: tempId, body, timestamp, status: result.ok ? "sent" : "failed" });
      if (result.ok) onSent();
      else notify.error(parseGraphError(result.data, "Failed to send message"));
    });
  }

  // Media/location/buttons share one settle path: no optimistic bubble, just
  // reload on success and surface Meta's error on failure.
  async function runSend(fn: () => Promise<{ ok: boolean; data: unknown }>, failMsg: string) {
    setBusy(true);
    try {
      const result = await fn();
      if (result.ok) {
        notify.success("Sent");
        onSent();
        return true;
      }
      notify.error(parseGraphError(result.data, failMsg));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleMedia() {
    const source = mediaSource.trim();
    if (!source) return;
    const media: { id?: string; link?: string; caption?: string; filename?: string } =
      /^https?:\/\//i.test(source) ? { link: source } : { id: source };
    if (mediaCaption.trim() && (mediaKind === "image" || mediaKind === "video" || mediaKind === "document")) {
      media.caption = mediaCaption.trim();
    }
    if (mediaKind === "document" && mediaFilename.trim()) media.filename = mediaFilename.trim();
    const ok = await runSend(
      () => messagesApi.sendMedia(config, phone, mediaKind, media),
      "Failed to send media",
    );
    if (ok) {
      setMediaSource("");
      setMediaCaption("");
      setMediaFilename("");
    }
  }

  async function handleLocation() {
    const latitude = Number(lat);
    const longitude = Number(lng);
    if (!lat.trim() || !lng.trim() || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      notify.error("Enter a valid latitude and longitude");
      return;
    }
    const location: { latitude: number; longitude: number; name?: string; address?: string } = {
      latitude,
      longitude,
    };
    if (locName.trim()) location.name = locName.trim();
    if (locAddress.trim()) location.address = locAddress.trim();
    const ok = await runSend(
      () => messagesApi.sendLocation(config, phone, location),
      "Failed to send location",
    );
    if (ok) {
      setLat("");
      setLng("");
      setLocName("");
      setLocAddress("");
    }
  }

  async function handleButtons() {
    const body = bodyText.trim();
    const labels = buttons.map((b) => b.trim()).filter(Boolean);
    if (!body) {
      notify.error("Add a message body");
      return;
    }
    if (labels.length === 0) {
      notify.error("Add at least one button");
      return;
    }
    const interactive = {
      body: { text: body },
      action: {
        buttons: labels.map((title, i) => ({
          type: "reply",
          reply: { id: `btn_${i + 1}`, title },
        })),
      },
    };
    const ok = await runSend(
      () => messagesApi.sendInteractiveButtons(config, phone, interactive),
      "Failed to send buttons",
    );
    if (ok) {
      setBodyText("");
      setButtons(["", "", ""]);
    }
  }

  return (
    <div className="pt-3 border-t border-black/10">
      <div className="flex items-center gap-1 mb-2" role="tablist" aria-label="Message type">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={type === tab.id}
            onClick={() => setType(tab.id)}
            className={`inline-flex items-center gap-1.5 rounded-[var(--radius-micro)] px-2.5 py-1.5 text-xs font-medium transition-colors ${
              type === tab.id
                ? "bg-notion-blue text-white"
                : "text-warm-600 hover:bg-warm-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {type === "text" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleText();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type a message…"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void e.currentTarget.form?.requestSubmit();
              }
            }}
            aria-label="Reply message"
            className="flex-1 resize-none rounded-[var(--radius-micro)] border border-input-border bg-white px-3 py-2 text-sm text-near-black placeholder:text-warm-500 focus:border-notion-blue focus:outline-none focus:ring-2 focus:ring-focus-blue/20"
          />
          <button
            type="submit"
            disabled={!replyText.trim()}
            className="shrink-0 inline-flex items-center justify-center size-10 rounded-full bg-notion-blue text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            aria-label="Send"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}

      {type === "media" && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {MEDIA_KINDS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMediaKind(k)}
                className={`rounded-[var(--radius-micro)] px-2 py-1 text-xs capitalize transition-colors ${
                  mediaKind === k ? "bg-warm-200 text-near-black" : "text-warm-500 hover:bg-warm-100"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <MediaField
            label="Media source"
            value={mediaSource}
            onChange={setMediaSource}
            kindFilter={mediaKind}
            required
          />
          {mediaKind === "document" && (
            <input
              value={mediaFilename}
              onChange={(e) => setMediaFilename(e.target.value)}
              placeholder="Filename (optional, e.g. invoice.pdf)"
              className={inputClass}
            />
          )}
          {(mediaKind === "image" || mediaKind === "video" || mediaKind === "document") && (
            <input
              value={mediaCaption}
              onChange={(e) => setMediaCaption(e.target.value)}
              placeholder="Caption (optional)"
              className={inputClass}
            />
          )}
          <button
            type="button"
            onClick={() => void handleMedia()}
            disabled={busy || !mediaSource.trim()}
            className="self-end inline-flex items-center gap-1.5 rounded-[var(--radius-micro)] bg-notion-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            <Send className="size-3.5" /> Send {mediaKind}
          </button>
        </div>
      )}

      {type === "location" && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              inputMode="decimal"
              className={inputClass}
            />
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              inputMode="decimal"
              className={inputClass}
            />
          </div>
          <input
            value={locName}
            onChange={(e) => setLocName(e.target.value)}
            placeholder="Name (optional)"
            className={inputClass}
          />
          <input
            value={locAddress}
            onChange={(e) => setLocAddress(e.target.value)}
            placeholder="Address (optional)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => void handleLocation()}
            disabled={busy || !lat.trim() || !lng.trim()}
            className="self-end inline-flex items-center gap-1.5 rounded-[var(--radius-micro)] bg-notion-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            <Send className="size-3.5" /> Send location
          </button>
        </div>
      )}

      {type === "buttons" && (
        <div className="flex flex-col gap-2">
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Message body…"
            rows={2}
            className={`${inputClass} resize-none`}
          />
          {buttons.map((b, i) => (
            <input
              key={i}
              value={b}
              onChange={(e) =>
                setButtons((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              placeholder={`Button ${i + 1}${i === 0 ? "" : " (optional)"} — max 20 chars`}
              maxLength={20}
              className={inputClass}
            />
          ))}
          <button
            type="button"
            onClick={() => void handleButtons()}
            disabled={busy || !bodyText.trim() || buttons.every((b) => !b.trim())}
            className="self-end inline-flex items-center gap-1.5 rounded-[var(--radius-micro)] bg-notion-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            <Send className="size-3.5" /> Send buttons
          </button>
        </div>
      )}
    </div>
  );
}
