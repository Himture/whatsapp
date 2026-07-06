"use client";

import { useState, useRef, useEffect, useCallback, startTransition } from "react";
import { Images, FileText, Film, Music, Copy, Trash2, Link2 } from "lucide-react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mediaApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import { notify } from "@/hooks/use-toast";
import { getMediaStore, type MediaAssetRecord, type MediaKind } from "@/lib/stores";
import { makeImageThumbnail, mediaKindFromMime, formatBytes } from "@/lib/media-thumbnail";
import type { ApiCallResult } from "@/lib/types";

const KIND_ICON: Record<MediaKind, typeof Images> = {
  image: Images, video: Film, audio: Music, document: FileText, sticker: Images,
};

export default function MediaPage() {
  return (
    <ConfigGuard>
      <MediaContent />
    </ConfigGuard>
  );
}

function MediaContent() {
  const { activeConfig, activeConfigId } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<MediaAssetRecord[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState("");

  const [retrieveMediaId, setRetrieveMediaId] = useState("");
  const [deleteMediaId, setDeleteMediaId] = useState("");
  const [downloadMediaId, setDownloadMediaId] = useState("");

  const loadAssets = useCallback(async () => {
    setAssets(await getMediaStore().getAssets(activeConfigId ?? undefined));
  }, [activeConfigId]);

  useEffect(() => { startTransition(() => { void loadAssets(); }); }, [loadAssets]);

  async function handleUpload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    const res = await mediaApi.upload(activeConfig, file, mediaType || file.type);
    setResult(res);
    setLoading(false);

    // Capture the returned media id into the local library with a thumbnail so
    // it's browsable and reusable instead of vanishing into the JSON response.
    const id = (res.data as { id?: string } | undefined)?.id;
    if (res.ok && id) {
      const mime = mediaType || file.type;
      const thumbnail = await makeImageThumbnail(file);
      await getMediaStore().addAsset({
        id,
        configId: activeConfigId ?? null,
        filename: file.name,
        mimeType: mime,
        kind: mediaKindFromMime(mime),
        size: file.size,
        thumbnail,
      });
      notify.success("Uploaded and saved to your library");
      if (fileRef.current) fileRef.current.value = "";
      void loadAssets();
    } else if (!res.ok) {
      notify.error("Upload failed — see response below");
    }
  }

  async function handleRetrieve(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    setResult(await mediaApi.getUrl(activeConfig, retrieveMediaId));
    setLoading(false);
  }

  async function handleDelete(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    setResult(await mediaApi.delete(activeConfig, deleteMediaId));
    setLoading(false);
  }

  async function handleDownload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    setResult(await mediaApi.getUrl(activeConfig, downloadMediaId));
    setLoading(false);
  }

  async function copyId(id: string) {
    try { await navigator.clipboard.writeText(id); notify.success("Media ID copied"); }
    catch { notify.error("Couldn't copy"); }
  }

  async function retrieveAsset(id: string) {
    if (!activeConfig) return;
    setResult(await mediaApi.getUrl(activeConfig, id));
  }

  // Delete from Meta AND from the local library. If Meta already expired the id
  // we still drop the local entry so the library reflects reality.
  async function deleteAsset(id: string) {
    if (!activeConfig) return;
    const res = await mediaApi.delete(activeConfig, id);
    await getMediaStore().deleteAsset(id);
    setResult(res);
    notify.success("Removed from library");
    void loadAssets();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">Media</h1>
        <p className="mt-1 text-sm text-warm-500">
          Upload media and reuse it anywhere. Your uploads are saved to a local library
          (Meta has no list-media API), so you never have to copy a media ID by hand.
        </p>
        <ApiDocLink />
      </div>

      <Tabs defaultValue="library">
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="retrieve">Retrieve URL</TabsTrigger>
          <TabsTrigger value="delete">Delete</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <Card>
            <CardContent className="pt-6">
              {assets.length === 0 ? (
                <p className="py-8 text-center text-sm text-warm-500">
                  Nothing uploaded yet. Use the Upload tab — files land here for reuse.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {assets.map((a) => {
                    const Icon = KIND_ICON[a.kind];
                    return (
                      <div key={a.id} className="rounded-[var(--radius-subtle)] border border-black/10 overflow-hidden bg-white">
                        <div className="aspect-video bg-warm-white flex items-center justify-center overflow-hidden">
                          {a.thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.thumbnail} alt={a.filename} className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="size-8 text-warm-500" aria-hidden="true" />
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-sm font-medium text-near-black" title={a.filename}>{a.filename}</p>
                          <p className="text-xs text-warm-500">{a.kind} · {formatBytes(a.size)}</p>
                          <p className="mt-1 truncate font-mono text-[10px] text-warm-500" title={a.id}>{a.id}</p>
                          <div className="mt-2 flex gap-1">
                            <button type="button" onClick={() => copyId(a.id)} aria-label="Copy media ID" title="Copy ID" className="p-1.5 rounded text-warm-500 hover:text-near-black">
                              <Copy className="size-3.5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => retrieveAsset(a.id)} aria-label="Retrieve URL" title="Retrieve URL" className="p-1.5 rounded text-warm-500 hover:text-near-black">
                              <Link2 className="size-3.5" aria-hidden="true" />
                            </button>
                            <button type="button" onClick={() => deleteAsset(a.id)} aria-label="Delete media" title="Delete from Meta + library" className="p-1.5 rounded text-warm-500 hover:text-danger">
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-near-black">
                    File<span className="ml-0.5 text-danger">*</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    required
                    className="text-sm text-near-black file:mr-3 file:rounded-[var(--radius-micro)] file:border-0 file:bg-black/5 file:px-3 file:py-2 file:text-sm file:font-medium"
                  />
                </div>
                <Input
                  label="MIME Type"
                  placeholder="e.g., image/jpeg (auto-detected if blank)"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value)}
                  description="Leave blank to use the file's detected MIME type"
                />
                <Button type="submit" loading={loading}>Upload Media</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrieve">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRetrieve} className="flex flex-col gap-4">
                <Input label="Media ID" placeholder="Enter media ID" value={retrieveMediaId} onChange={(e) => setRetrieveMediaId(e.target.value)} required />
                <Button type="submit" loading={loading}>Retrieve URL</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleDelete} className="flex flex-col gap-4">
                <Input label="Media ID" placeholder="Enter media ID to delete" value={deleteMediaId} onChange={(e) => setDeleteMediaId(e.target.value)} required />
                <Button type="submit" variant="danger" loading={loading}>Delete Media</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="download">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleDownload} className="flex flex-col gap-4">
                <Input label="Media ID" placeholder="Enter media ID to download" value={downloadMediaId} onChange={(e) => setDownloadMediaId(e.target.value)} required description="First retrieves the media URL, then you can download from the returned URL" />
                <Button type="submit" loading={loading}>Get Download URL</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
