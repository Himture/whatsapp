"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { messagesApi } from "@/lib/whatsapp";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { ApiCallResult } from "@/lib/types";

const MEDIA_TYPES = ["image", "audio", "video", "document", "sticker"] as const;
type MediaType = (typeof MEDIA_TYPES)[number];

const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: "Image",
  audio: "Audio",
  video: "Video",
  document: "Document",
  sticker: "Sticker",
};

const SUPPORTS_CAPTION: ReadonlySet<MediaType> = new Set(["image", "video", "document"]);
const SUPPORTS_FILENAME: ReadonlySet<MediaType> = new Set(["document"]);

type SourceMode = "id" | "url";

const FIELD_LABELS = {
  RECIPIENT: "Recipient Phone Number",
  MEDIA_ID: "Media ID",
  MEDIA_URL: "Media URL",
  CAPTION: "Caption",
  FILENAME: "Filename",
  REPLY_TO: "Reply To Message ID",
} as const;

const PLACEHOLDERS = {
  RECIPIENT: "e.g. 14155238886",
  MEDIA_ID: "e.g. 123456789",
  MEDIA_URL: "https://example.com/media.jpg",
  CAPTION: "Optional caption...",
  FILENAME: "document.pdf",
  REPLY_TO: "wamid.xxx (optional)",
} as const;

function MediaSubForm({ mediaType }: { mediaType: MediaType }) {
  const { activeConfig } = useWhatsAppConfig();
  const [recipient, setRecipient] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("url");
  const [mediaId, setMediaId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [filename, setFilename] = useState("");
  const [replyToMessageId, setReplyToMessageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiCallResult | null>(null);

  const showCaption = SUPPORTS_CAPTION.has(mediaType);
  const showFilename = SUPPORTS_FILENAME.has(mediaType);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    setLoading(true);
    try {
      const media: { id?: string; link?: string; caption?: string; filename?: string } = {};
      if (sourceMode === "id") {
        media.id = mediaId;
      } else {
        media.link = mediaUrl;
      }
      if (showCaption && caption) media.caption = caption;
      if (showFilename && filename) media.filename = filename;

      const response = await messagesApi.sendMedia(
        activeConfig,
        recipient,
        mediaType,
        media,
        replyToMessageId || undefined,
      );
      setResult(response);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <Input
        label={FIELD_LABELS.RECIPIENT}
        placeholder={PLACEHOLDERS.RECIPIENT}
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-near-black">Source:</span>
        <label className="flex items-center gap-1.5 text-sm text-near-black">
          <input
            type="radio"
            name={`source-${mediaType}`}
            checked={sourceMode === "url"}
            onChange={() => setSourceMode("url")}
            className="accent-notion-blue"
          />
          URL
        </label>
        <label className="flex items-center gap-1.5 text-sm text-near-black">
          <input
            type="radio"
            name={`source-${mediaType}`}
            checked={sourceMode === "id"}
            onChange={() => setSourceMode("id")}
            className="accent-notion-blue"
          />
          Media ID
        </label>
      </div>

      {sourceMode === "id" ? (
        <Input
          label={FIELD_LABELS.MEDIA_ID}
          placeholder={PLACEHOLDERS.MEDIA_ID}
          value={mediaId}
          onChange={(e) => setMediaId(e.target.value)}
          required
        />
      ) : (
        <Input
          label={FIELD_LABELS.MEDIA_URL}
          placeholder={PLACEHOLDERS.MEDIA_URL}
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          required
        />
      )}

      {showCaption && (
        <Input
          label={FIELD_LABELS.CAPTION}
          placeholder={PLACEHOLDERS.CAPTION}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      )}

      {showFilename && (
        <Input
          label={FIELD_LABELS.FILENAME}
          placeholder={PLACEHOLDERS.FILENAME}
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
        />
      )}

      <Input
        label={FIELD_LABELS.REPLY_TO}
        placeholder={PLACEHOLDERS.REPLY_TO}
        value={replyToMessageId}
        onChange={(e) => setReplyToMessageId(e.target.value)}
      />

      <Button type="submit" loading={loading}>
        Send {MEDIA_TYPE_LABELS[mediaType]}
      </Button>

      <ResponseViewer result={result} />
    </form>
  );
}

export function MediaMessageForm() {
  return (
    <Tabs defaultValue="image">
      <TabsList>
        {MEDIA_TYPES.map((type) => (
          <TabsTrigger key={type} value={type}>
            {MEDIA_TYPE_LABELS[type]}
          </TabsTrigger>
        ))}
      </TabsList>
      {MEDIA_TYPES.map((type) => (
        <TabsContent key={type} value={type}>
          <MediaSubForm mediaType={type} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
