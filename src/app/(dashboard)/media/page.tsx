"use client";

import { useState, useRef } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mediaApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function MediaPage() {
  return (
    <ConfigGuard>
      <MediaContent />
    </ConfigGuard>
  );
}

function MediaContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState("");

  const [retrieveMediaId, setRetrieveMediaId] = useState("");
  const [deleteMediaId, setDeleteMediaId] = useState("");
  const [downloadMediaId, setDownloadMediaId] = useState("");

  async function handleUpload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    const res = await mediaApi.upload(activeConfig, file, mediaType || file.type);
    setResult(res);
    setLoading(false);
  }

  async function handleRetrieve(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await mediaApi.getUrl(activeConfig, retrieveMediaId);
    setResult(res);
    setLoading(false);
  }

  async function handleDelete(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await mediaApi.delete(activeConfig, deleteMediaId);
    setResult(res);
    setLoading(false);
  }

  async function handleDownload(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await mediaApi.getUrl(activeConfig, downloadMediaId);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Media
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Upload, retrieve, download, and delete media files used in WhatsApp messages.
        </p>
        <ApiDocLink />
      </div>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="retrieve">Retrieve URL</TabsTrigger>
          <TabsTrigger value="delete">Delete</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

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
                <Button type="submit" loading={loading}>
                  Upload Media
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retrieve">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleRetrieve} className="flex flex-col gap-4">
                <Input
                  label="Media ID"
                  placeholder="Enter media ID"
                  value={retrieveMediaId}
                  onChange={(e) => setRetrieveMediaId(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading}>
                  Retrieve URL
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delete">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleDelete} className="flex flex-col gap-4">
                <Input
                  label="Media ID"
                  placeholder="Enter media ID to delete"
                  value={deleteMediaId}
                  onChange={(e) => setDeleteMediaId(e.target.value)}
                  required
                />
                <Button type="submit" variant="danger" loading={loading}>
                  Delete Media
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="download">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleDownload} className="flex flex-col gap-4">
                <Input
                  label="Media ID"
                  placeholder="Enter media ID to download"
                  value={downloadMediaId}
                  onChange={(e) => setDownloadMediaId(e.target.value)}
                  required
                  description="First retrieves the media URL, then you can download from the returned URL"
                />
                <Button type="submit" loading={loading}>
                  Get Download URL
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
