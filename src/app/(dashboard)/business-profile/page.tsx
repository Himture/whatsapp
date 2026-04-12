"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { businessProfileApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

const VERTICAL_OPTIONS = [
  { label: "Select a vertical...", value: "" },
  { label: "Automotive", value: "AUTOMOTIVE" },
  { label: "Beauty, Spa and Salon", value: "BEAUTY_SPA_SALON" },
  { label: "Clothing and Apparel", value: "CLOTHING_APPAREL" },
  { label: "Education", value: "EDUCATION" },
  { label: "Entertainment", value: "ENTERTAINMENT" },
  { label: "Event Planning and Service", value: "EVENT_PLANNING_SERVICE" },
  { label: "Finance and Banking", value: "FINANCE_BANKING" },
  { label: "Food and Grocery", value: "FOOD_GROCERY" },
  { label: "Health", value: "HEALTH" },
  { label: "Hotel and Lodging", value: "HOTEL_LODGING" },
  { label: "Non-Profit", value: "NON_PROFIT" },
  { label: "Professional Services", value: "PROFESSIONAL_SERVICES" },
  { label: "Restaurant", value: "RESTAURANT" },
  { label: "Retail", value: "RETAIL" },
  { label: "Shopping and Retail", value: "SHOPPING_RETAIL" },
  { label: "Travel and Transportation", value: "TRAVEL_TRANSPORTATION" },
  { label: "Other", value: "OTHER" },
  { label: "Undefined", value: "UNDEFINED" },
];

export default function BusinessProfilePage() {
  return (
    <ConfigGuard>
      <BusinessProfileContent />
    </ConfigGuard>
  );
}

function BusinessProfileContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadSessionId, setUploadSessionId] = useState("");
  const [uploadSessionResult, setUploadSessionResult] = useState<ApiCallResult | null>(null);
  const [uploadFileResult, setUploadFileResult] = useState<ApiCallResult | null>(null);

  const [about, setAbout] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [vertical, setVertical] = useState("");
  const [websites, setWebsites] = useState("");

  async function handleViewProfile() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await businessProfileApi.get(activeConfig);
    setResult(res);
    setLoading(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadFileName(file.name);
      setUploadSessionId("");
      setUploadSessionResult(null);
      setUploadFileResult(null);
    }
  }

  async function handleCreateUploadSession(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig || !uploadFile) return;

    setLoading(true);
    try {
      const res = await businessProfileApi.createUploadSession(
        activeConfig,
        uploadFile.size,
        uploadFile.type,
        uploadFileName,
      );
      setUploadSessionResult(res);
      if (res.ok && res.data) {
        const data = res.data as { id: string };
        if (data.id) {
          setUploadSessionId(data.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadFile() {
    if (!activeConfig || !uploadFile || !uploadSessionId) return;

    setLoading(true);
    try {
      const res = await businessProfileApi.uploadFileData(
        activeConfig,
        uploadSessionId,
        uploadFile,
      );
      setUploadFileResult(res);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;

    const profile: Record<string, unknown> = {};
    if (about) profile.about = about;
    if (description) profile.description = description;
    if (address) profile.address = address;
    if (email) profile.email = email;
    if (vertical) profile.vertical = vertical;
    if (websites.trim()) {
      profile.websites = websites.split("\n").map((w) => w.trim()).filter(Boolean);
    }

    setLoading(true);
    const res = await businessProfileApi.update(activeConfig, profile);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Business Profile
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          View and update your WhatsApp Business profile information.
        </p>
        <ApiDocLink />
      </div>

      <Tabs defaultValue="view">
        <TabsList>
          <TabsTrigger value="view">View Profile</TabsTrigger>
          <TabsTrigger value="update">Update Profile</TabsTrigger>
          <TabsTrigger value="upload-picture">Upload Profile Picture</TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-warm-500 mb-4">
                Retrieve your current WhatsApp Business profile details.
              </p>
              <Button onClick={handleViewProfile} loading={loading}>
                View Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="update">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                <Input
                  label="About"
                  placeholder="Brief description of your business"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  description="Max 139 characters"
                  maxLength={139}
                />
                <Textarea
                  label="Description"
                  placeholder="Detailed business description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  description="Max 512 characters"
                  maxLength={512}
                />
                <Input
                  label="Address"
                  placeholder="Business address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  description="Max 256 characters"
                  maxLength={256}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="Business email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  description="Max 128 characters"
                  maxLength={128}
                />
                <Dropdown
                  label="Vertical"
                  options={VERTICAL_OPTIONS}
                  value={vertical}
                  onChange={(val: string) => setVertical(val)}
                  description="Industry category for your business"
                />
                <Textarea
                  label="Websites"
                  placeholder="https://example.com&#10;https://shop.example.com"
                  value={websites}
                  onChange={(e) => setWebsites(e.target.value)}
                  description="One URL per line, max 2 websites"
                />
                <Button type="submit" loading={loading}>
                  Update Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="upload-picture">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-near-black mb-2">
                  Step 1: Select a file and create an upload session
                </p>
                <form onSubmit={handleCreateUploadSession} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-near-black">
                      Profile Picture File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      required
                      className="text-sm text-warm-500 file:mr-4 file:py-2 file:px-4 file:rounded-[var(--radius-standard)] file:border file:border-[#ddd] file:text-sm file:font-medium file:bg-white file:text-near-black hover:file:bg-gray-50"
                    />
                    <p className="text-xs text-warm-500">
                      Select an image file for your business profile picture
                    </p>
                  </div>
                  {uploadFile && (
                    <p className="text-xs text-warm-500">
                      Selected: {uploadFileName} ({uploadFile.type}, {uploadFile.size} bytes)
                    </p>
                  )}
                  <Button type="submit" loading={loading} disabled={!uploadFile}>
                    Create Upload Session
                  </Button>
                </form>
                <ResponseViewer result={uploadSessionResult} />
              </div>

              {uploadSessionId && (
                <div>
                  <p className="text-sm font-semibold text-near-black mb-2">
                    Step 2: Upload the file data
                  </p>
                  <p className="text-xs text-warm-500 mb-4">
                    Upload session ID: {uploadSessionId}
                  </p>
                  <Button onClick={handleUploadFile} loading={loading}>
                    Upload File
                  </Button>
                  <ResponseViewer result={uploadFileResult} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ResponseViewer result={result} />
    </div>
  );
}
