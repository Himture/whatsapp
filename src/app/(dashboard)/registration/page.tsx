"use client";

import { useState } from "react";
import { useWhatsAppConfig } from "@/hooks/use-whatsapp-config";
import { ConfigGuard } from "@/components/whatsapp/config-guard";
import { ResponseViewer } from "@/components/whatsapp/response-viewer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { registrationApi } from "@/lib/whatsapp";
import { ApiDocLink } from "@/components/whatsapp/api-doc-link";
import type { ApiCallResult } from "@/lib/types";

export default function RegistrationPage() {
  return (
    <ConfigGuard>
      <RegistrationContent />
    </ConfigGuard>
  );
}

function RegistrationContent() {
  const { activeConfig } = useWhatsAppConfig();
  const [result, setResult] = useState<ApiCallResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");

  async function handleRegister(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeConfig) return;
    setLoading(true);
    const res = await registrationApi.register(activeConfig, pin);
    setResult(res);
    setLoading(false);
  }

  async function handleDeregister() {
    if (!activeConfig) return;
    setLoading(true);
    const res = await registrationApi.deregister(activeConfig);
    setResult(res);
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-near-black">
          Registration
        </h1>
        <p className="mt-1 text-sm text-warm-500">
          Register or deregister your phone number with the WhatsApp Cloud API.
        </p>
        <ApiDocLink />
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-4">Register Phone</CardTitle>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <Input
                label="PIN"
                placeholder="Enter 6-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                maxLength={6}
                pattern="[0-9]{6}"
                description="A 6-digit PIN for two-step verification"
              />
              <Button type="submit" loading={loading}>
                Register Phone
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <CardTitle className="text-lg mb-4">Deregister Phone</CardTitle>
            <p className="text-sm text-warm-500 mb-4">
              Remove your phone number registration from the WhatsApp Cloud API. This action cannot be undone easily.
            </p>
            <Button variant="danger" onClick={handleDeregister} loading={loading}>
              Deregister Phone
            </Button>
          </CardContent>
        </Card>
      </div>

      <ResponseViewer result={result} />
    </div>
  );
}
