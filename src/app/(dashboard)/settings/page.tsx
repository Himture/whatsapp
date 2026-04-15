"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WebhookSetupCallout } from "@/components/whatsapp/webhook-setup-callout";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { LoadingPage } from "@/components/ui/loading";
import { API_VERSIONS, type ApiVersion } from "@/lib/constants";
import { maskToken, buildGraphApiUrl } from "@/lib/utils";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { useSessionMode } from "@/lib/session-mode";
import { getDataStore, type ConfigRecord } from "@/lib/datastore";
import { notify } from "@/hooks/use-toast";

const VERSION_OPTIONS = API_VERSIONS.map((v) => ({ label: v, value: v }));

export default function SettingsPage() {
  const { mode } = useSessionMode();
  const { configs, loading, refresh } = useWhatsAppConfig();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  const [name, setName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [businessPortfolioId, setBusinessPortfolioId] = useState("");
  const [apiVersion, setApiVersion] = useState<ApiVersion>("v21.0");
  const [appSecret, setAppSecret] = useState("");

  const storeMode: "remote" | "local" | null =
    mode === "authenticated" ? "remote" : mode === "local" ? "local" : null;

  function resetForm() {
    setName("");
    setAccessToken("");
    setPhoneNumberId("");
    setWabaId("");
    setBusinessPortfolioId("");
    setApiVersion("v21.0");
    setAppSecret("");
    setShowSecret(false);
    setShowForm(false);
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!storeMode) return;
    setSaving(true);
    setError(null);

    const store = getDataStore(storeMode);
    const result = await store.createConfig({
      name,
      accessToken,
      phoneNumberId,
      wabaId,
      businessPortfolioId: businessPortfolioId || undefined,
      apiVersion,
      appSecret: appSecret || undefined,
    });

    if (result.success) {
      resetForm();
      notify.success("Configuration saved");
      await refresh();
    } else {
      setError(result.error ?? "Failed to create configuration");
    }

    setSaving(false);
  }

  async function handleConfirmDelete() {
    if (!storeMode || !deleteId) return;
    const store = getDataStore(storeMode);
    const result = await store.deleteConfig(deleteId);
    if (result.success) {
      notify.success("Configuration deleted");
      await refresh();
    } else {
      notify.error(result.error ?? "Failed to delete");
    }
    setDeleteId(null);
  }

  async function handleSetDefault(configId: string) {
    if (!storeMode) return;
    const store = getDataStore(storeMode);
    const result = await store.setDefaultConfig(configId);
    if (result.success) {
      notify.success("Default updated");
      await refresh();
    } else {
      notify.error(result.error ?? "Failed to set default");
    }
  }

  async function handleTestConnection(config: ConfigRecord) {
    try {
      const url = buildGraphApiUrl(config.apiVersion, `${config.wabaId}/phone_numbers`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (res.ok) {
        notify.success("Connection successful — your API key is valid.");
      } else {
        const data: { error?: { message?: string } } = await res.json();
        notify.error(`Connection failed: ${data?.error?.message ?? "Unknown error"}`);
      }
    } catch {
      notify.error("Connection failed: Network error");
    }
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-near-black">
            Settings
          </h1>
          <p className="mt-1 text-sm text-warm-500">
            Manage your WhatsApp API configurations
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>Add Configuration</Button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-[var(--radius-micro)] bg-red-50 p-3 text-sm text-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-4">New Configuration</CardTitle>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <Input
                label="Configuration Name"
                placeholder="e.g., Production, Testing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Access Token"
                type="password"
                placeholder="Your WhatsApp Cloud API access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                description="System user or user access token from Meta Developer Portal"
              />
              <Input
                label="Phone Number ID"
                placeholder="e.g., 123456789012345"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                required
              />
              <Input
                label="WABA ID"
                placeholder="WhatsApp Business Account ID"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                required
              />
              <Input
                label="Business Portfolio ID"
                placeholder="Optional"
                value={businessPortfolioId}
                onChange={(e) => setBusinessPortfolioId(e.target.value)}
              />
              <Dropdown
                label="API Version"
                options={VERSION_OPTIONS}
                value={apiVersion}
                onChange={(val) => setApiVersion(val as ApiVersion)}
                required
              />
              <div className="relative">
                <Input
                  label="App Secret (recommended)"
                  type={showSecret ? "text" : "password"}
                  placeholder="From Meta App dashboard → Settings → Basic"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  description="Without this, incoming webhooks are dropped (we cannot verify they come from Meta)."
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2 top-7 p-1 text-warm-500 hover:text-near-black"
                  aria-label={showSecret ? "Hide app secret" : "Show app secret"}
                >
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div className="flex gap-3 mt-2">
                <Button type="submit" loading={saving}>
                  Save Configuration
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {configs.length === 0 && !showForm ? (
        <Card className="bg-warm-white border-none">
          <CardContent className="py-10 text-center">
            <CardDescription>
              No configurations yet. Add your first WhatsApp API configuration to get started.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="py-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">
                        {config.name}
                      </CardTitle>
                      {config.isDefault && <Badge variant="success">Default</Badge>}
                      {config.appSecret ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-800"
                          title="Webhooks signature-verified"
                        >
                          <ShieldCheck className="size-3" /> Signed webhooks
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900"
                          title="Set an App Secret to receive webhooks securely"
                        >
                          <ShieldAlert className="size-3" /> Webhooks dropped
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-3">
                      <div>
                        <span className="text-warm-500">Phone Number ID:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {config.phoneNumberId}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-500">WABA ID:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {config.wabaId}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-500">Token:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {maskToken(config.accessToken)}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-500">Version:</span>{" "}
                        <span className="text-near-black">{config.apiVersion}</span>
                      </div>
                    </div>
                    <WebhookSetupCallout
                      configId={config.id}
                      verifyToken={config.webhookVerifyToken}
                      variant="inline"
                      dismissible={false}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTestConnection(config)}
                    >
                      Test
                    </Button>
                    {!config.isDefault && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefault(config.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteId(config.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete configuration?"
        description="This removes the API credentials. Your WhatsApp number is unaffected and you can re-add it anytime."
        confirmLabel="Delete"
        destructive
      />
    </div>
  );
}
