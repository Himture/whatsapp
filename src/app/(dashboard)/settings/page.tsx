"use client";

import { useState, useCallback, useEffect, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_VERSIONS, type ApiVersion } from "@/lib/constants";
import { maskToken } from "@/lib/utils";
import {
  getConfigs,
  createConfig,
  deleteConfig,
  setDefaultConfig,
} from "./actions";

interface WhatsAppConfigRow {
  id: string;
  name: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  businessPortfolioId: string | null;
  apiVersion: string;
  isDefault: boolean;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

const VERSION_OPTIONS = API_VERSIONS.map((v) => ({ label: v, value: v }));

export default function SettingsPage() {
  const [configs, setConfigs] = useState<WhatsAppConfigRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const [name, setName] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [wabaId, setWabaId] = useState("");
  const [businessPortfolioId, setBusinessPortfolioId] = useState("");
  const [apiVersion, setApiVersion] = useState<ApiVersion>("v21.0");

  const loadConfigs = useCallback(async () => {
    try {
      const data = await getConfigs();
      setConfigs(data);
    } catch {
      setError("Failed to load configurations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadConfigs();
    });
  }, [loadConfigs]);

  useEffect(() => {
    if (toast === null) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  function resetForm() {
    setName("");
    setAccessToken("");
    setPhoneNumberId("");
    setWabaId("");
    setBusinessPortfolioId("");
    setApiVersion("v21.0");
    setShowForm(false);
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await createConfig({
      name,
      accessToken,
      phoneNumberId,
      wabaId,
      businessPortfolioId: businessPortfolioId || undefined,
      apiVersion,
    });

    if (result.success) {
      resetForm();
      await loadConfigs();
    } else {
      setError(result.error ?? "Failed to create configuration");
    }

    setSaving(false);
  }

  async function handleDelete(configId: string) {
    const result = await deleteConfig(configId);
    if (result.success) {
      await loadConfigs();
    } else {
      setError(result.error ?? "Failed to delete");
    }
  }

  async function handleSetDefault(configId: string) {
    const result = await setDefaultConfig(configId);
    if (result.success) {
      await loadConfigs();
    } else {
      setError(result.error ?? "Failed to set default");
    }
  }

  async function handleTestConnection(config: WhatsAppConfigRow) {
    try {
      const url = `https://graph.facebook.com/${config.apiVersion}/${config.wabaId}/phone_numbers`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${config.accessToken}` },
      });
      if (res.ok) {
        showToast("Connection successful! Your API key is valid.", "success");
      } else {
        const data: { error?: { message?: string } } = await res.json();
        showToast(
          `Connection failed: ${data?.error?.message ?? "Unknown error"}`,
          "error",
        );
      }
    } catch {
      showToast("Connection failed: Network error", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="size-6 animate-spin rounded-full border-2 border-notion-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div
          className={`mb-4 rounded-[var(--radius-micro)] p-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-danger"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

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
        <div className="mb-4 rounded-[var(--radius-micro)] bg-red-50 p-3 text-sm text-danger">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">
                        {config.name}
                      </CardTitle>
                      {config.isDefault && <Badge variant="success">Default</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div>
                        <span className="text-warm-300">Phone Number ID:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {config.phoneNumberId}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-300">WABA ID:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {config.wabaId}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-300">Token:</span>{" "}
                        <span className="text-near-black font-mono text-xs">
                          {maskToken(config.accessToken)}
                        </span>
                      </div>
                      <div>
                        <span className="text-warm-300">Version:</span>{" "}
                        <span className="text-near-black">{config.apiVersion}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
                      onClick={() => handleDelete(config.id)}
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
    </div>
  );
}
