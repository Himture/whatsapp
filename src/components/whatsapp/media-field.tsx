"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { Images, FileText, Film, Music, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getMediaStore, type MediaAssetRecord, type MediaKind } from "@/lib/stores";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { formatBytes } from "@/lib/media-thumbnail";

const KIND_ICON: Record<MediaKind, typeof Images> = {
  image: Images,
  video: Film,
  audio: Music,
  document: FileText,
  sticker: Images,
};

// A media source input: type/paste a Media ID or public URL, OR pick from the
// local library of previously-uploaded media. Used by the broadcast composer,
// template image headers, and the inbox composer so nobody hand-copies IDs.
export function MediaField({
  label,
  value,
  onChange,
  description,
  required,
  kindFilter,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  required?: boolean;
  kindFilter?: MediaKind;
}) {
  const { activeConfigId } = useWhatsAppConfig();
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);

  const load = useCallback(async () => {
    const all = await getMediaStore().getAssets(activeConfigId ?? undefined);
    setAssets(kindFilter ? all.filter((a) => a.kind === kindFilter) : all);
  }, [activeConfigId, kindFilter]);

  useEffect(() => { if (open) startTransition(() => { void load(); }); }, [open, load]);

  return (
    <div className="flex flex-col gap-1.5">
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Media ID, https URL — or pick from library"
        description={description}
        required={required}
      />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="self-start text-xs font-medium text-notion-blue hover:underline"
      >
        {open ? "Hide library" : "Pick from library"}
      </button>

      {open && (
        <div className="rounded-[var(--radius-micro)] border border-black/10 bg-warm-white p-2">
          {assets.length === 0 ? (
            <p className="px-1 py-3 text-xs text-warm-500">
              No uploads yet. Upload on the Media page — they&apos;ll appear here.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto">
              {assets.map((a) => {
                const Icon = KIND_ICON[a.kind];
                const selected = value === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { onChange(a.id); setOpen(false); }}
                    title={`${a.filename} · ${formatBytes(a.size)}`}
                    className={`group relative aspect-square rounded-[var(--radius-micro)] border overflow-hidden bg-white ${selected ? "border-notion-blue ring-2 ring-focus-blue/30" : "border-black/10 hover:border-notion-blue"}`}
                  >
                    {a.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.thumbnail} alt={a.filename} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-warm-500">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-1 py-0.5 text-[10px] text-white">
                      {a.filename}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="mt-2 inline-flex items-center gap-1 text-xs text-warm-500 hover:text-danger"
            >
              <X className="size-3" aria-hidden="true" /> Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
